import { and, eq } from 'drizzle-orm';
import { investmentTargets } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }

    const deleted = await fetchOne(
        (db as any).delete(investmentTargets as any)
          .where(and(
              eq((investmentTargets as any).id, Number(id)),
              eq((investmentTargets as any).userId, user.id)
          ))
          .returning()
    );

    if (!deleted) {
        throw createError({ statusCode: 404, statusMessage: 'Target not found or unauthorized' });
    }

    return { success: true };
});
