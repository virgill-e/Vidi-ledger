import { and, eq } from 'drizzle-orm';
import { recurrences, transactions } from '../database/schema';
import { db, fetchOne } from './db';

const routeId = (event: Parameters<typeof getRouterParam>[0]) => {
    const id = Number(getRouterParam(event, 'id'));
    if (!Number.isInteger(id) || id <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'A valid id is required' });
    }
    return id;
};

/** The wallet's transaction named by the `:id` route param, or 404. Auto-imported. */
export const requireTransaction = async (event: Parameters<typeof getRouterParam>[0], walletId: number) => {
    const tx = await fetchOne(db.select().from(transactions)
        .where(and(eq(transactions.id, routeId(event)), eq(transactions.walletId, walletId))));
    if (!tx) throw createError({ statusCode: 404, statusMessage: 'Transaction not found' });
    return tx;
};

/** The wallet's recurrence named by the `:id` route param, or 404. Auto-imported. */
export const requireRecurrence = async (event: Parameters<typeof getRouterParam>[0], walletId: number) => {
    const rule = await fetchOne(db.select().from(recurrences)
        .where(and(eq(recurrences.id, routeId(event)), eq(recurrences.walletId, walletId))));
    if (!rule) throw createError({ statusCode: 404, statusMessage: 'Recurrence not found' });
    return rule;
};
