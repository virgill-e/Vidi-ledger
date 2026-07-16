import { desc, eq } from 'drizzle-orm';
import { sessions } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const userSession = await getUserSession(event);

    const sessionsAny = sessions as any;
    const rows = await fetchAll(
        db.select().from(sessionsAny)
            .where(eq(sessionsAny.userId, user.id))
            .orderBy(desc(sessionsAny.lastActiveAt)),
    );

    return {
        sessions: rows.map((row: any) => ({
            id: row.id,
            userAgent: row.userAgent,
            ipAddress: row.ipAddress,
            createdAt: row.createdAt,
            lastActiveAt: row.lastActiveAt,
            current: row.id === userSession.sessionId,
        })),
    };
});
