import { eq } from 'drizzle-orm';
import { categories } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const user = session.user as { id: number };
    const userCategories = await fetchAll(db.select().from(categories as any).where(eq((categories as any).userId, user.id)));

    return userCategories;
});
