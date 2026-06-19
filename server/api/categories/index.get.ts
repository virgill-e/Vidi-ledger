import { eq } from 'drizzle-orm';
import { categories } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const userCategories = await fetchAll(db.select().from(categories as any).where(eq((categories as any).userId, user.id)));

    return userCategories;
});
