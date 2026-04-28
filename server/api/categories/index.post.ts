import { categories } from '../../database/schema';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const body = await readBody(event);
    const { name, icon, color, maxBudget } = body;

    if (!name || !icon || !color) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Name, icon and color are required',
        });
    }

    const user = session.user as { id: number; email: string; name: string };
    const [newCategory] = await db.insert(categories).values({
        userId: user.id,
        name,
        icon,
        color,
        maxBudget: maxBudget ? Math.round(Number(maxBudget) * 100) : null,
    }).returning();

    return newCategory;
});
