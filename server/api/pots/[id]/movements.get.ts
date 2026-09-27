import { and, eq } from 'drizzle-orm';
import { potTransfers, transactions } from '../../../database/schema';
import { db, fetchAll } from '../../../utils/db';

// Everything that moved the pot's balance, newest first. `amount` is signed
// from the pot's point of view.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const pot = await requirePot(wallet.id, Number(getRouterParam(event, 'id')), { statusCode: 404 });

    const [transfers, movements] = await Promise.all([
        fetchAll(db.select().from(potTransfers).where(and(eq(potTransfers.walletId, wallet.id), eq(potTransfers.potId, pot.id)))),
        fetchAll(db.select().from(transactions).where(and(eq(transactions.walletId, wallet.id), eq(transactions.potId, pot.id)))),
    ]);

    return [
        ...transfers.map((t: any) => ({
            kind: 'transfer' as const,
            id: t.id,
            date: t.date,
            memo: t.memo,
            direction: t.direction,
            amount: t.direction === 'to_pot' ? t.amount : -t.amount,
            createdAt: t.createdAt,
        })),
        ...movements.map((m: any) => ({
            kind: 'transaction' as const,
            id: m.id,
            date: m.date,
            memo: m.memo,
            type: m.type,
            categoryId: m.categoryId,
            amount: m.type === 'expense' || m.type === 'buy' ? -m.amount : m.amount,
            createdAt: m.createdAt,
        })),
    ].sort((a, b) => (a.date === b.date ? +new Date(b.createdAt) - +new Date(a.createdAt) : a.date < b.date ? 1 : -1));
});
