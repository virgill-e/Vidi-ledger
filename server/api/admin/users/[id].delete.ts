import { eq, and, ne } from 'drizzle-orm';
import { users, expenses, categories, sessions } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    if (session.user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Admin access required',
        });
    }

    const id = getRouterParam(event, 'id');
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User ID is required',
        });
    }

    const targetId = Number(id);

    // Fetch the user to check their role before deleting
    const targetUser = await fetchOne(db.select().from(users as any).where(eq((users as any).id, targetId)));

    if (!targetUser) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
        });
    }

    // Role check: cannot delete admin accounts
    if (targetUser.role === 'admin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Cannot delete admin accounts',
        });
    }

    // Manually delete related data (since no cascade is configured)
    await db.delete(expenses as any).where(eq((expenses as any).userId, targetId)).execute();
    await db.delete(categories as any).where(eq((categories as any).userId, targetId)).execute();
    await db.delete(sessions as any).where(eq((sessions as any).userId, targetId)).execute();

    // Finally delete the user
    await db.delete(users as any).where(eq((users as any).id, targetId)).execute();

    return { success: true };
});
