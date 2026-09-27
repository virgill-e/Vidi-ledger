import { eq } from 'drizzle-orm';
import { transactions } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const tx = await requireTransaction(event, wallet.id);
    if (tx.type !== 'buy' && tx.type !== 'sell' && tx.type !== 'dividend') {
        throw createError({ statusCode: 400, statusMessage: 'Not an investment movement' });
    }

    const body = await validateBody(event, investmentUpdateSchema);
    const changes: Record<string, unknown> = {};
    if (body.amount !== undefined) changes.amount = toCents(body.amount);
    if (body.date !== undefined) changes.date = body.date;
    if (body.memo !== undefined) changes.memo = body.memo || null;
    if (body.quantity !== undefined) {
        if (body.quantity === null && tx.type !== 'dividend') {
            throw createError({ statusCode: 400, statusMessage: 'quantity: Quantity is required' });
        }
        changes.quantity = body.quantity;
    }
    if (body.potId !== undefined && body.potId !== tx.potId) {
        if (body.potId !== null) await requirePot(wallet.id, body.potId, { active: true });
        changes.potId = body.potId;
    }
    if (Object.keys(changes).length === 0) return tx;

    const next = { ...tx, ...changes };
    if (changes.potId !== undefined || changes.amount !== undefined) {
        await assertPotsAfterEdit(wallet.id, tx, { potId: next.potId, amount: next.amount });
    }
    if (tx.type !== 'dividend' && (changes.quantity !== undefined || changes.date !== undefined)) {
        await assertNoOversell(wallet.id, tx.assetId, { replace: next });
    }

    return fetchOne(db.update(transactions).set(changes).where(eq(transactions.id, tx.id)).returning());
});
