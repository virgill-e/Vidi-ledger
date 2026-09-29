import { and, eq, isNotNull } from 'drizzle-orm';
import { pots, potTransfers, recurrences, transactions } from '../database/schema';
import { db, fetchAll, fetchOne } from './db';

/** Wallet fields the pot balance needs: its period and "today" (timezone). */
export interface PotWallet {
    id: number;
    startDate: string;
    endDate: string | null;
    timezone: string;
}

export interface PotRuleRow extends PotRecurrenceRow {
    id: number;
}

/** Recurring contributions of the wallet (or of one pot). */
const loadPotRules = (walletId: number, potId?: number): Promise<PotRuleRow[]> =>
    fetchAll(db.select({
        id: recurrences.id,
        potId: recurrences.potId,
        amount: recurrences.amount,
        frequency: recurrences.frequency,
        startDate: recurrences.startDate,
        endDate: recurrences.endDate,
    }).from(recurrences).where(and(
        eq(recurrences.walletId, walletId),
        potId === undefined ? isNotNull(recurrences.potId) : eq(recurrences.potId, potId),
    )));

/** Every period credited so far by recurring contributions (as of today). Auto-imported. */
export const potRuleCredits = (wallet: PotWallet, rules: PotRuleRow[]) => {
    const today = todayIn(wallet.timezone);
    return rules.flatMap((rule) => recurringPotCredits(rule, today, wallet)
        .map((credit) => ({ ...credit, potId: rule.potId, recurrenceId: rule.id })));
};

/** Current balance of every pot of the wallet (cents). Auto-imported. */
export const walletPotBalances = async (wallet: PotWallet) => {
    const [transfers, movements, rules] = await Promise.all([
        fetchAll(db.select({ potId: potTransfers.potId, direction: potTransfers.direction, amount: potTransfers.amount })
            .from(potTransfers).where(eq(potTransfers.walletId, wallet.id))),
        fetchAll(db.select({ id: transactions.id, potId: transactions.potId, type: transactions.type, amount: transactions.amount })
            .from(transactions).where(and(eq(transactions.walletId, wallet.id), isNotNull(transactions.potId)))),
        loadPotRules(wallet.id),
    ]);
    return { transfers, movements, rules, balances: potBalances(transfers, movements, potRuleCredits(wallet, rules)) };
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
 * Throws 400 if the pot's balance (as of today) would go negative once the
 * given movement and/or transfer are left out, its recurring contributions
 * are rewritten by `rules`, and `delta` (signed cents) is applied — e.g.
 * `delta: -amount` for an expense paid from the pot, `excludeTransactionId`
 * for a movement being edited or deleted. Auto-imported.
 */
export const assertPotBalance = async (
    wallet: PotWallet,
    potId: number,
    change: {
        delta?: number;
        excludeTransactionId?: number;
        excludeTransferId?: number;
        rules?: (current: PotRuleRow[]) => PotRuleRow[];
    } = {},
) => {
    const [transfers, movements, rules] = await Promise.all([
        fetchAll(db.select({ id: potTransfers.id, potId: potTransfers.potId, direction: potTransfers.direction, amount: potTransfers.amount })
            .from(potTransfers).where(and(eq(potTransfers.walletId, wallet.id), eq(potTransfers.potId, potId)))),
        fetchAll(db.select({ id: transactions.id, potId: transactions.potId, type: transactions.type, amount: transactions.amount })
            .from(transactions).where(and(eq(transactions.walletId, wallet.id), eq(transactions.potId, potId)))),
        loadPotRules(wallet.id, potId),
    ]);
    const balance = potBalances(
        transfers.filter((t: any) => t.id !== change.excludeTransferId),
        movements.filter((m: any) => m.id !== change.excludeTransactionId),
        potRuleCredits(wallet, change.rules ? change.rules(rules) : rules),
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
    wallet: PotWallet,
    tx: { id: number; type: string; potId: number | null },
    next: { potId: number | null; amount: number },
) => {
    const sign = isOutflow(tx.type) ? -1 : 1;
    if (next.potId !== null) {
        await assertPotBalance(wallet, next.potId, { excludeTransactionId: tx.id, delta: sign * next.amount });
    }
    if (tx.potId !== null && tx.potId !== next.potId) {
        await assertPotBalance(wallet, tx.potId, { excludeTransactionId: tx.id });
    }
};

/** True if the pot still has a recurring contribution running today or later. */
export const potHasActiveRule = async (wallet: PotWallet, potId: number) => {
    const today = todayIn(wallet.timezone);
    return (await loadPotRules(wallet.id, potId)).some((r) => r.endDate === null || r.endDate >= today);
};
