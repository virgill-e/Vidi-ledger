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
    if (type) updateData.type = type;
    if (asset) updateData.asset = asset;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (date) updateData.date = new Date(date);
    if (note !== undefined) updateData.note = note;

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
