import { eq } from 'drizzle-orm';
import { investmentTargets } from '../../../database/schema';
import { db, fetchAll } from '../../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);

    return await fetchAll(
        db.select()
          .from(investmentTargets as any)
          .where(eq((investmentTargets as any).userId, user.id))
    );
});
