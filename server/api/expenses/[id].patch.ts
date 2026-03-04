import { eq, and } from 'drizzle-orm';
import { expenses } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    const user = session.user as { id: number };
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Expense ID is required',
        });
    }

    const { categoryId, amount, merchant, date, note } = body;

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
