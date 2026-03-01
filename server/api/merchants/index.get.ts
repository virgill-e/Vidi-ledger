import { eq, sql, desc } from 'drizzle-orm';
import { expenses } from '../../database/schema';
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
        // Query to get distinct merchant names ranked by frequency
        // We use sql`count(*)` to rank them. We use any casts for cross-dialect compatibility.
        const query = (db as any)
            .select({
                name: (expenses as any).merchant,
            })
            .from(expenses as any)
            .where(eq((expenses as any).userId, userId))
            .groupBy((expenses as any).merchant)
            .orderBy(desc(sql`count(*)`))
            .limit(20);

        const results = await fetchAll(query);
        return results.map((m: any) => m.name);
    } catch (error) {
        console.error('Merchant API Error:', error);
        return [];
    }
});
