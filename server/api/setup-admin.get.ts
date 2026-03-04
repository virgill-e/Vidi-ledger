import { eq, count } from 'drizzle-orm';
import { users } from '../database/schema';
import { db, fetchOne, fetchAll } from '../utils/db';

export default defineEventHandler(async (event) => {
    // Only allow if no admins exist
    const admins = await fetchAll(db.select().from(users as any).where(eq((users as any).role, 'admin')));

    if (admins.length > 0) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Admin already exists. Use the admin panel.',
        });
    }

    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Please log in first.',
        });
    }

    // Promote the current user
    await db.update(users as any)
        .set({ role: 'admin' } as any)
        .where(eq((users as any).id, session.user.id))
        .execute();

    // Update session
    await setUserSession(event, {
        user: {
            ...session.user,
            role: 'admin'
        }
    });

    return { success: true, message: 'You are now an admin. Please refresh the page.' };
});
