import { eq, and } from 'drizzle-orm';
import { categories } from '../../database/schema';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Category ID is required',
        });
    }

    const { name, color, icon, maxBudget } = await validateBody(event, categoryUpdateSchema);

    const updated = await fetchOne(db.update(categories as any)
        .set({
            name,
            color,
            icon,
            maxBudget: maxBudget !== undefined ? (maxBudget ? Math.round(maxBudget * 100) : null) : undefined,
        } as any)
        .where(
            and(
                eq((categories as any).id, Number(id)),
                eq((categories as any).userId, user.id)
            )
        )
        .returning());

    if (!updated) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Category not found or unauthorized',
        });
    }

    return updated;
});
