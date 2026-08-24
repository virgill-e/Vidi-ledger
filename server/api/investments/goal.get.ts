import { eq } from 'drizzle-orm';
import { investmentGoals } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);

    const goal = await fetchOne(
        db.select()
          .from(investmentGoals as any)
          .where(eq((investmentGoals as any).userId, user.id))
    );

    return goal || null;
});
