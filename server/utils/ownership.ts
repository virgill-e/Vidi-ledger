import { and, eq } from 'drizzle-orm';
import { categories } from '../database/schema';
import { db, fetchOne } from './db';

/**
 * Assert that the given category belongs to the user.
 * Throws 400 if it does not exist or belongs to someone else — prevents
 * attaching an expense to another user's category (cross-user data leak,
 * since reads join categories on categoryId).
 *
 * Auto-imported by Nitro (like `requireAuth` / `validateBody`).
 */
export const assertCategoryOwned = async (categoryId: number, userId: number) => {
    const category = await fetchOne(
        db.select({ id: (categories as any).id })
            .from(categories as any)
            .where(and(eq((categories as any).id, categoryId), eq((categories as any).userId, userId))),
    );

    if (!category) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid category',
        });
    }
};
