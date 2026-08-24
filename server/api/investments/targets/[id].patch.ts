import { and, eq } from 'drizzle-orm';
import { investmentTargets } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const id = getRouterParam(event, 'id');

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'ID is required' });
    }

    const { asset, targetPercent } = await validateBody(event, investmentTargetUpdateSchema);

    const updateData: any = {};
    if (asset !== undefined) updateData.asset = asset;
    if (targetPercent !== undefined) updateData.targetPercent = targetPercent;

    const updated = await fetchOne(
        db.update(investmentTargets as any)
          .set(updateData)
          .where(and(
              eq((investmentTargets as any).id, Number(id)),
              eq((investmentTargets as any).userId, user.id)
          ))
          .returning()
    );

    if (!updated) {
        throw createError({ statusCode: 404, statusMessage: 'Target not found' });
    }

    return updated;
});
