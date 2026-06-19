import { eq, and, desc } from 'drizzle-orm';
import { expenses } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);

    const { merchant } = getQuery(event);
    if (!merchant) {
        return null;
    }

    const userId = user.id;

    try {
        const query = (db as any)
            .select({
                categoryId: (expenses as any).categoryId,
            })
            .from(expenses as any)
            .where(
                and(
                    eq((expenses as any).userId, userId),
                    eq((expenses as any).merchant, merchant as string)
                )
            )
            .orderBy(desc((expenses as any).date), desc((expenses as any).createdAt))
            .limit(1);

        const result = await fetchOne(query);
        return result || null;
    } catch (error) {
        console.error('Last Category API Error:', error);
        return null;
    }
});
