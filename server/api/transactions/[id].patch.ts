import { eq } from 'drizzle-orm';
import { transactions } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

// Edits a one-off expense/income. The type (sign) never changes: moving to a
// category of the other kind is rejected.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const tx = await requireTransaction(event, wallet.id);
    if (tx.type !== 'expense' && tx.type !== 'income') {
        throw createError({ statusCode: 400, statusMessage: 'Use the investment endpoint for this movement' });
    }

    const body = await validateBody(event, transactionUpdateSchema);
    const changes: Record<string, unknown> = {};

    if (body.categoryId !== undefined && body.categoryId !== tx.categoryId) {
        await requireMovementCategory(wallet.id, body.categoryId, tx.type);
        changes.categoryId = body.categoryId;
    }
    if (body.date !== undefined) {
        assertDateInWallet(wallet, body.date);
        changes.date = body.date;
    }
    if (body.amount !== undefined) changes.amount = toCents(body.amount);
    if (body.memo !== undefined) changes.memo = body.memo || null;
    if (body.spreadDays !== undefined) {
        if (tx.type === 'income' && body.spreadDays > 1) {
            throw createError({ statusCode: 400, statusMessage: 'spreadDays: Only expenses can be spread' });
        }
        changes.spreadDays = body.spreadDays;
    }

    if (body.potId !== undefined && body.potId !== tx.potId) {
        if (body.potId !== null) await requirePot(wallet.id, body.potId, { active: true });
        changes.potId = body.potId;
    }
    if (changes.potId !== undefined || changes.amount !== undefined) {
        await assertPotsAfterEdit(wallet.id, tx, {
            potId: changes.potId !== undefined ? changes.potId as number | null : tx.potId,
            amount: (changes.amount as number | undefined) ?? tx.amount,
        });
    }

    if (Object.keys(changes).length === 0) return tx;

    return fetchOne(db.update(transactions).set(changes).where(eq(transactions.id, tx.id)).returning());
});
