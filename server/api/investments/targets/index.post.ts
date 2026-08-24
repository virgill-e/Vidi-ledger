import { and, eq } from 'drizzle-orm';
import { investmentTargets } from '../../../database/schema';
import { db, fetchOne } from '../../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const { asset, targetPercent } = await validateBody(event, investmentTargetUpsertSchema);

    const existing = await fetchOne(
        db.select()
          .from(investmentTargets as any)
          .where(and(
              eq((investmentTargets as any).userId, user.id),
              eq((investmentTargets as any).asset, asset)
          ))
    );

    if (existing) {
        return await fetchOne(
            db.update(investmentTargets as any)
              .set({ targetPercent })
              .where(eq((investmentTargets as any).id, existing.id))
              .returning()
        );
    }

    return await fetchOne(
        db.insert(investmentTargets as any).values({
            userId: user.id,
            asset,
            targetPercent,
            createdAt: new Date(),
        }).returning()
    );
});
