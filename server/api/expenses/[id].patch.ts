import { eq, and } from 'drizzle-orm';
import { expenses } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Expense ID is required',
        });
    }

    const { categoryId, amount, merchant, date, note } = await validateBody(event, expenseUpdateSchema);

    const updated = await fetchOne((db as any).update(expenses as any)
        .set({
            categoryId,
            amount: amount !== undefined ? Math.round(amount * 100) : undefined,
            merchant,
            date: date ? new Date(date) : undefined,
            note,
        } as any)
        .where(
            and(
                eq((expenses as any).id, Number(id)),
                eq((expenses as any).userId, user.id)
            )
        )
        .returning());

    if (!updated) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Expense not found or unauthorized',
        });
    }

    return updated;
});
