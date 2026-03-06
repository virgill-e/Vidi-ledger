import { db, fetchOne } from '../../utils/db';
import { investments } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    if (!session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const user = session.user as { id: number };
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }

    const deleted = await fetchOne((db as any).delete(investments as any)
        .where(
            and(
                eq((investments as any).id, Number(id)),
                eq((investments as any).userId, user.id)
            )
        )
        .returning());

    if (!deleted) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Investment not found or unauthorized',
        });
    }

    return { success: true };
});
