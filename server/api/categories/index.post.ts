import { categories } from '../../database/schema';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);

    const { name, icon, color, maxBudget } = await validateBody(event, categoryCreateSchema);
    const [newCategory] = await db.insert(categories).values({
        userId: user.id,
        name,
        icon,
        color,
        maxBudget: maxBudget ? Math.round(Number(maxBudget) * 100) : null,
    }).returning();

    return newCategory;
});
