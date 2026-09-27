import { recurrences } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

// A rule may start before the wallet: the engine only counts days inside it.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const body = await validateBody(event, recurrenceCreateSchema);
    const category = await requireMovementCategory(wallet.id, body.categoryId);

    const created = await fetchOne(db.insert(recurrences).values({
        walletId: wallet.id,
        categoryId: category.id,
        kind: category.kind,
        amount: toCents(body.amount),
        frequency: body.frequency,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        memo: body.memo || null,
    }).returning());

    setResponseStatus(event, 201);
    return created;
});
