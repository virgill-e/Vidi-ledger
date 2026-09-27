import { eq } from 'drizzle-orm';
import { wallets } from '../../../../database/schema';
import { db } from '../../../../utils/db';

// Resets the account: deletes its wallet and, by cascade, everything in it.
// The account stays; the user goes through onboarding again.
export default defineEventHandler(async (event) => {
    await defineRateLimit({ max: 10, window: 60 })(event);
    const { target } = await requireManageableUser(event);
    await db.delete(wallets).where(eq(wallets.userId, target.id)).execute();
    return { success: true };
});
