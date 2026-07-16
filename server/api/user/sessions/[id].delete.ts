import { and, eq } from 'drizzle-orm';
import { sessions } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const userSession = await getUserSession(event);

    const id = getRouterParam(event, 'id');
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Session id is required',
        });
    }

    const sessionsAny = sessions as any;
    const target = await fetchOne(
        db.select().from(sessionsAny).where(and(eq(sessionsAny.id, id), eq(sessionsAny.userId, user.id))),
    );

    if (!target) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Session not found',
        });
    }

    await db.delete(sessionsAny).where(eq(sessionsAny.id, id)).execute();

    // Revoking the device we're currently on: clear its cookie immediately
    // instead of waiting for the next request's requireAuth check to 401.
    if (id === userSession.sessionId) {
        await clearUserSession(event);
    }

    return { success: true };
});
