import { db, fetchAll } from '../../utils/db';
import { investments } from '../../database/schema';
import { desc, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);

    const results = await fetchAll(db
        .select()
        .from(investments as any)
        .where(eq((investments as any).userId, user.id))
        .orderBy(desc((investments as any).date)));

    return results;
});
