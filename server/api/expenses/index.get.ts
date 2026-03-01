import { eq, desc } from 'drizzle-orm';
import { expenses, categories } from '../../database/schema';
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
    const userExpenses = await fetchAll(db.select({
        id: expenses.id,
        amount: expenses.amount,
        merchant: expenses.merchant,
        date: expenses.date,
        note: expenses.note,
        category: {
            id: categories.id,
            name: categories.name,
            icon: categories.icon,
            color: categories.color
        }
    } as any)
        .from(expenses as any)
        .innerJoin(categories as any, eq((expenses as any).categoryId, (categories as any).id))
        .where(eq((expenses as any).userId, user.id))
        .orderBy(desc((expenses as any).date)));

    return userExpenses;
});
