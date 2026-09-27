import { eq } from 'drizzle-orm';
import { recurrences } from '../../database/schema';
import { db } from '../../utils/db';

// Removes the rule from the whole budget history. To stop it from a given
// day instead, PATCH its `endDate`.
export default defineEventHandler(async (event) => {
    const { wallet } = await requireWallet(event);
    const rule = await requireRecurrence(event, wallet.id);
    await db.delete(recurrences).where(eq(recurrences.id, rule.id)).execute();
    return { success: true };
});
