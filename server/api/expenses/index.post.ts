import { expenses } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const body = await readBody(event);
    const { categoryId, amount, merchant, date, note } = body;

    if (!categoryId || amount === undefined || !merchant || !date) {
        throw createError({
            statusCode: 400,
            statusMessage: 'CategoryId, amount, merchant and date are required',
        });
    }

    const user = session.user as { id: number };
    const newExpense = await fetchOne(db.insert(expenses as any).values({
        userId: user.id,
        categoryId,
        amount: Math.round(amount * 100), // Convert to cents
        merchant,
        date: new Date(date),
        note,
    } as any).returning());

    return newExpense;
});
