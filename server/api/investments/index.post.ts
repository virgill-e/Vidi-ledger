import { db, fetchOne } from '../../utils/db';
import { investments } from '../../database/schema';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    if (!session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const user = session.user as { id: number };
    const body = await readBody(event);
    const { type, asset, amount, quantity, date, note } = body;

    // Validate
    if (!type || (type !== 'buy' && type !== 'sell')) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid type (buy or sell)' });
    }
    if (!asset || typeof asset !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Asset is required' });
    }
    if (amount === undefined || isNaN(Number(amount))) {
        throw createError({ statusCode: 400, statusMessage: 'Amount is required' });
    }
    if (quantity === undefined || isNaN(Number(quantity))) {
        throw createError({ statusCode: 400, statusMessage: 'Quantity is required' });
    }
    if (!date) {
        throw createError({ statusCode: 400, statusMessage: 'Date is required' });
    }

    const newInvestment = await fetchOne(db.insert(investments as any).values({
        userId: user.id,
        type,
        asset,
        amount: Number(amount),
        quantity: Number(quantity),
        date: new Date(date),
        note: note || null,
        createdAt: new Date()
    }).returning());

    return newInvestment;
});
