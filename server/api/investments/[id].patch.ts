import { db, fetchOne } from '../../utils/db';
import { investments } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    if (!session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const userId = (session.user as { id: number }).id;
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }

    const body = await readBody(event);
    const { type, asset, amount, quantity, date, note } = body;

    const updateData: any = {};
    if (type) {
        if (type !== 'buy' && type !== 'sell' && type !== 'dividend') {
            throw createError({ statusCode: 400, statusMessage: 'Invalid type (buy, sell or dividend)' });
        }
        updateData.type = type;
    }
    if (asset) {
        if (typeof asset !== 'string' || !asset) {
            throw createError({ statusCode: 400, statusMessage: 'Asset cannot be empty' });
        }
        updateData.asset = asset;
    }
    if (amount !== undefined) {
        if (amount === null || isNaN(Number(amount))) {
            throw createError({ statusCode: 400, statusMessage: 'Amount must be a number' });
        }
        updateData.amount = Number(amount);
    }
    if (quantity !== undefined) {
        const qVal = (quantity === null || quantity === '') ? 0 : Number(quantity);
        if (isNaN(qVal)) {
            throw createError({ statusCode: 400, statusMessage: 'Quantity must be a number' });
        }
        updateData.quantity = qVal;
    }
    if (date) {
        updateData.date = new Date(date);
    }
    if (note !== undefined) {
        updateData.note = note || null;
    }

    const updated = await fetchOne(
        db.update(investments as any)
            .set(updateData)
            .where(and(
                eq((investments as any).id, parseInt(id)),
                eq((investments as any).userId, userId)
            ))
            .returning()
    );

    if (!updated) {
        throw createError({ statusCode: 404, statusMessage: 'Investment not found' });
    }

    return updated;
});
