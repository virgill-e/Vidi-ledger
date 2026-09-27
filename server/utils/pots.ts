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
 * Throws 400 if taking `amount` out of the pot would make its balance
 * negative. `excludeTransactionId` ignores a movement being edited.
 */
export const assertPotCovers = async (walletId: number, potId: number, amount: number, excludeTransactionId?: number) => {
    const { transfers, movements } = await walletPotBalances(walletId);
    const balance = potBalances(transfers, movements.filter((m: any) => m.id !== excludeTransactionId)).get(potId) ?? 0;
    if (amount > balance) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Insufficient pot balance',
        });
    }
};
