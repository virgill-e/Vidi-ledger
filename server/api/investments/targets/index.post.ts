import { and, eq } from 'drizzle-orm';
import { investmentTargets } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const { asset, targetPercent, currentValueOverride } = await validateBody(event, investmentTargetUpsertSchema);

    const existing = await fetchOne(
        db.select()
          .from(investmentTargets as any)
          .where(and(
              eq((investmentTargets as any).userId, user.id),
              eq((investmentTargets as any).asset, asset)
          ))
    );

    if (existing) {
        const updateData: any = { targetPercent };
        if (currentValueOverride !== undefined) updateData.currentValueOverride = currentValueOverride;

        return await fetchOne(
            db.update(investmentTargets as any)
              .set(updateData)
              .where(eq((investmentTargets as any).id, existing.id))
              .returning()
        );
    }

    return await fetchOne(
        db.insert(investmentTargets as any).values({
            userId: user.id,
            asset,
            targetPercent,
            currentValueOverride: currentValueOverride ?? null,
            createdAt: new Date(),
        }).returning()
    );
});
