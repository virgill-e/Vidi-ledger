import { eq, sql, desc } from 'drizzle-orm';
import { investments } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const userId = (session.user as { id: number }).id;

    try {
        // Query to get distinct asset names ranked by frequency
        const query = (db as any)
            .select({
                name: (investments as any).asset,
            })
            .from(investments as any)
            .where(eq((investments as any).userId, userId))
            .groupBy((investments as any).asset)
            .orderBy(desc(sql`count(*)`))
            .limit(20);

        const results = await fetchAll(query);
        return results.map((a: any) => a.name);
    } catch (error) {
        console.error('Assets API Error:', error);
        return [];
    }
});
