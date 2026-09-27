import { eq } from 'drizzle-orm';
import { potTransfers, recurrences, transactions } from '../database/schema';
import { db, fetchAll } from '../utils/db';

// Budget from today (wallet timezone) over the next `days` days, projected
// with the rules and the movements already dated in the future.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const days = Math.min(60, Math.max(1, Number(getQuery(event).days) || 7));

    const today = todayIn(wallet.timezone);
    const [rules, movements, transfers] = await Promise.all([
        fetchAll(db.select({
            kind: recurrences.kind,
            amount: recurrences.amount,
            frequency: recurrences.frequency,
            startDate: recurrences.startDate,
            endDate: recurrences.endDate,
        }).from(recurrences).where(eq(recurrences.walletId, wallet.id))),
        fetchAll(db.select({
            type: transactions.type,
            date: transactions.date,
            amount: transactions.amount,
            potId: transactions.potId,
            spreadDays: transactions.spreadDays,
        }).from(transactions).where(eq(transactions.walletId, wallet.id))),
        fetchAll(db.select({
            direction: potTransfers.direction,
            amount: potTransfers.amount,
            date: potTransfers.date,
        }).from(potTransfers).where(eq(potTransfers.walletId, wallet.id))),
    ]);

    const all = computeBudget({
        wallet,
        recurrences: rules,
        transactions: movements,
        potTransfers: transfers,
        until: addDays(today, days - 1),
    });

    return {
        today,
        startDate: wallet.startDate,
        endDate: wallet.endDate,
        days: all.filter((d) => d.date >= today),
    };
});
