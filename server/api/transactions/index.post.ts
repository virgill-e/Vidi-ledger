import { transactions } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

// One-off expense or income; the type follows the category's kind.
// Investment movements (buy/sell/dividend) have their own endpoint.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const body = await validateBody(event, transactionCreateSchema);

    const category = await requireMovementCategory(wallet.id, body.categoryId);
    assertDateInWallet(wallet, body.date);
    if (category.kind === 'income' && body.spreadDays > 1) {
        throw createError({ statusCode: 400, statusMessage: 'spreadDays: Only expenses can be spread' });
    }
    const potId = body.potId ?? null;
    if (potId !== null) {
        await requirePot(wallet.id, potId, { active: true });
        if (category.kind === 'expense') await assertPotBalance(wallet, potId, { delta: -toCents(body.amount) });
    }

    const created = await fetchOne(db.insert(transactions).values({
        walletId: wallet.id,
        categoryId: category.id,
        type: category.kind,
        date: body.date,
        amount: toCents(body.amount),
        memo: body.memo || null,
        spreadDays: body.spreadDays,
        potId,
    }).returning());

    setResponseStatus(event, 201);
    return created;
});
