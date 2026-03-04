import { eq, and } from 'drizzle-orm';
import { expenses } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    const user = session.user as { id: number };
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Expense ID is required',
        });
    }

    const deleted = await fetchOne((db as any).delete(expenses as any)
        .where(
            and(
                eq((expenses as any).id, Number(id)),
                eq((expenses as any).userId, user.id)
            )
        )
        .returning());

    if (!deleted) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Expense not found or unauthorized',
        });
    }

    return { success: true };
});
