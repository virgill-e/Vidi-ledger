import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { transactions } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

const querySchema = z.object({
    from: z.string().refine(isLocalDate).optional(),
    to: z.string().refine(isLocalDate).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(500),
});

// Newest first; same-day movements in reverse insertion order.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const query = querySchema.safeParse(getQuery(event));
    if (!query.success) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid query' });
    }
    const { from, to, categoryId, limit } = query.data;

    const filters = [eq(transactions.walletId, wallet.id)];
    if (from) filters.push(gte(transactions.date, from));
    if (to) filters.push(lte(transactions.date, to));
    if (categoryId) filters.push(eq(transactions.categoryId, categoryId));

    return fetchAll(db.select().from(transactions)
        .where(and(...filters))
        .orderBy(desc(transactions.date), desc(transactions.id))
        .limit(limit));
});
