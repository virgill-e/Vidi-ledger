import { expenses } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);

    const { categoryId, amount, merchant, date, note } = await validateBody(event, expenseCreateSchema);

    await assertCategoryOwned(categoryId, user.id);

    const newExpense = await fetchOne(db.insert(expenses as any).values({
        userId: user.id,
        categoryId,
        amount: Math.round(amount * 100), // Convert to cents
        merchant,
        date: new Date(date),
        note,
    } as any).returning());

    return newExpense;
});
