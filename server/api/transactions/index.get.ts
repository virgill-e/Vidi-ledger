import { and, desc, eq, gte, lt, lte, or } from 'drizzle-orm';
import { z } from 'zod';
import { transactions } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

const querySchema = z.object({
    from: z.string().refine(isLocalDate).optional(),
    to: z.string().refine(isLocalDate).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(500),
    // Keyset pagination: the movements listed after this one (the last of the previous page).
    beforeDate: z.string().refine(isLocalDate).optional(),
    beforeId: z.coerce.number().int().positive().optional(),
}).refine((q) => (q.beforeDate === undefined) === (q.beforeId === undefined));

// Newest first; same-day movements in reverse insertion order.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const query = querySchema.safeParse(getQuery(event));
    if (!query.success) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid query' });
    }
    const { from, to, categoryId, limit, beforeDate, beforeId } = query.data;

    const filters = [eq(transactions.walletId, wallet.id)];
    if (from) filters.push(gte(transactions.date, from));
    if (to) filters.push(lte(transactions.date, to));
    if (categoryId) filters.push(eq(transactions.categoryId, categoryId));
    if (beforeDate && beforeId) {
        filters.push(or(lt(transactions.date, beforeDate), and(eq(transactions.date, beforeDate), lt(transactions.id, beforeId)))!);
    }

    return fetchAll(db.select().from(transactions)
        .where(and(...filters))
        .orderBy(desc(transactions.date), desc(transactions.id))
        .limit(limit));
});
