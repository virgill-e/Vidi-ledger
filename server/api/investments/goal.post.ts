import { eq } from 'drizzle-orm';
import { investmentGoals } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);
    const { totalTarget } = await validateBody(event, investmentGoalUpsertSchema);

    const existing = await fetchOne(
        db.select()
          .from(investmentGoals as any)
          .where(eq((investmentGoals as any).userId, user.id))
    );

    if (existing) {
        return await fetchOne(
            db.update(investmentGoals as any)
              .set({ totalTarget })
              .where(eq((investmentGoals as any).id, existing.id))
              .returning()
        );
    }

    return await fetchOne(
        db.insert(investmentGoals as any).values({
            userId: user.id,
            totalTarget,
            createdAt: new Date(),
        }).returning()
    );
});
