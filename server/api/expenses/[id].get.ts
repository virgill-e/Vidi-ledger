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

    const expense = await fetchOne((db as any).select()
        .from(expenses as any)
        .where(
            and(
                eq((expenses as any).id, Number(id)),
                eq((expenses as any).userId, user.id)
            )
        ));

    if (!expense) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Expense not found',
        });
    }

    return expense;
});
