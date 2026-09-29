import { recurrences } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

// Recurring contribution to the pot: a recurring expense for the budget
// (smoothed per day), credited to the pot period by period.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const pot = await requirePot(wallet.id, Number(getRouterParam(event, 'id')), { statusCode: 404 });
    if (pot.archivedAt) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid pot' });
    }
    const body = await validateBody(event, potRecurrenceCreateSchema);

    const created = await fetchOne(db.insert(recurrences).values({
        walletId: wallet.id,
        potId: pot.id,
        categoryId: null,
        kind: 'expense',
        amount: toCents(body.amount),
        frequency: body.frequency,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        memo: body.memo || null,
    }).returning());

    setResponseStatus(event, 201);
    return created;
});
