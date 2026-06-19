import { db, fetchOne } from '../../utils/db';
import { investments } from '../../database/schema';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    if (!session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const user = session.user as { id: number };
    const { type, asset, amount, quantity, date, note } = await validateBody(event, investmentCreateSchema);

    // For dividends quantity is optional and defaults to 0; for buy/sell the
    // schema guarantees it is present.
    const parsedQuantity = type === 'dividend' ? (quantity ?? 0) : quantity!;

    const newInvestment = await fetchOne(db.insert(investments as any).values({
        userId: user.id,
        type,
        asset,
        amount,
        quantity: parsedQuantity,
        date: new Date(date),
        note: note || null,
        createdAt: new Date()
    }).returning());

    return newInvestment;
});
