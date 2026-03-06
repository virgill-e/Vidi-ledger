import { db, fetchAll } from '../../utils/db';
import { investments } from '../../database/schema';
import { desc, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    if (!session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const user = session.user as { id: number };

    const results = await fetchAll(db
        .select()
        .from(investments as any)
        .where(eq((investments as any).userId, user.id))
        .orderBy(desc((investments as any).date)));

    return results;
});
