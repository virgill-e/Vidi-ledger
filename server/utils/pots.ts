import { and, eq, isNotNull } from 'drizzle-orm';
import { pots, potTransfers, transactions } from '../database/schema';
import { db, fetchAll, fetchOne } from './db';

/** Current balance of every pot of the wallet (cents). Auto-imported. */
export const walletPotBalances = async (walletId: number) => {
    const [transfers, movements] = await Promise.all([
        fetchAll(db.select({ potId: potTransfers.potId, direction: potTransfers.direction, amount: potTransfers.amount })
            .from(potTransfers).where(eq(potTransfers.walletId, walletId))),
        fetchAll(db.select({ id: transactions.id, potId: transactions.potId, type: transactions.type, amount: transactions.amount })
            .from(transactions).where(and(eq(transactions.walletId, walletId), isNotNull(transactions.potId)))),
    ]);
    return { transfers, movements, balances: potBalances(transfers, movements) };
};

/**
 * Load a pot of the wallet; with `active`, archived pots are refused (they
 * cannot receive new movements). Throws 400 for pots referenced in a body,
 * 404 when named by the route. Auto-imported.
 */
export const requirePot = async (walletId: number, potId: number, options: { active?: boolean; statusCode?: 400 | 404 } = {}) => {
    const pot = await fetchOne(db.select().from(pots).where(and(eq(pots.id, potId), eq(pots.walletId, walletId))));
    if (!pot || (options.active && pot.archivedAt)) {
        throw createError({
            statusCode: options.statusCode ?? 400,
            statusMessage: options.statusCode === 404 ? 'Pot not found' : 'Invalid pot',
        });
    }
    return pot;
};

/**
 * Throws 400 if the pot's balance would go negative once the given movement
 * and/or transfer are left out and `delta` (signed cents) is applied — e.g.
 * `delta: -amount` for an expense paid from the pot, `excludeTransactionId`
 * for a movement being edited or deleted. Auto-imported.
 */
export const assertPotBalance = async (
    walletId: number,
    potId: number,
    change: { delta?: number; excludeTransactionId?: number; excludeTransferId?: number } = {},
) => {
    const [transfers, movements] = await Promise.all([
        fetchAll(db.select({ id: potTransfers.id, potId: potTransfers.potId, direction: potTransfers.direction, amount: potTransfers.amount })
            .from(potTransfers).where(and(eq(potTransfers.walletId, walletId), eq(potTransfers.potId, potId)))),
        fetchAll(db.select({ id: transactions.id, potId: transactions.potId, type: transactions.type, amount: transactions.amount })
            .from(transactions).where(and(eq(transactions.walletId, walletId), eq(transactions.potId, potId)))),
    ]);
    const balance = potBalances(
        transfers.filter((t: any) => t.id !== change.excludeTransferId),
        movements.filter((m: any) => m.id !== change.excludeTransactionId),
    ).get(potId) ?? 0;

    if (balance + (change.delta ?? 0) < 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Insufficient pot balance',
        });
    }
};

export const isOutflow = (type: string) => type === 'expense' || type === 'buy';

/**
 * Pot checks when a movement's pot and/or amount change: the pot it leaves
 * (or keeps) must not go negative. Auto-imported.
 */
export const assertPotsAfterEdit = async (
    walletId: number,
    tx: { id: number; type: string; potId: number | null },
    next: { potId: number | null; amount: number },
) => {
    const sign = isOutflow(tx.type) ? -1 : 1;
    if (next.potId !== null) {
        await assertPotBalance(walletId, next.potId, { excludeTransactionId: tx.id, delta: sign * next.amount });
    }
    if (tx.potId !== null && tx.potId !== next.potId) {
        await assertPotBalance(walletId, tx.potId, { excludeTransactionId: tx.id });
    }
};
