import { and, eq } from 'drizzle-orm';
import { categories } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);

    const id = Number(getRouterParam(event, 'id'));
    if (!Number.isInteger(id) || id <= 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'A valid category id is required',
        });
    }

    const { archived, ...fields } = await validateBody(event, categoryUpdateSchema);

    // Categories are archived rather than deleted: past movements keep pointing at them.
    const changes: Record<string, unknown> = { ...fields };
    if (archived !== undefined) changes.archivedAt = archived ? new Date() : null;
    if (Object.keys(changes).length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Nothing to update',
        });
    }

    const updated = await fetchOne(db.update(categories)
        .set(changes)
        .where(and(eq(categories.id, id), eq(categories.walletId, wallet.id)))
        .returning());

    if (!updated) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Category not found',
        });
    }
    return updated;
});
