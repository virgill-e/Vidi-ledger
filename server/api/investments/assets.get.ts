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
        // Query to get distinct asset names and their total quantity
        const results = await fetchAll(db
            .select({
                name: (investments as any).asset,
                totalQuantity: sql<number>`SUM(CASE WHEN type = 'buy' THEN quantity ELSE -quantity END)`,
            })
            .from(investments as any)
            .where(eq((investments as any).userId, userId))
            .groupBy((investments as any).asset)
            .orderBy(desc(sql`count(*)`))
            .limit(50));

        return results;
    } catch (error) {
        console.error('Assets API Error:', error);
        return [];
    }
});
