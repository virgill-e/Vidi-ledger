import { eq } from 'drizzle-orm';
import { users } from '../../../database/schema';
import { db } from '../../../utils/db';

// Deletes the account; sessions and the wallet (with all its data) cascade.
export default defineEventHandler(async (event) => {
    await defineRateLimit({ max: 10, window: 60 })(event);
    const { target } = await requireManageableUser(event);
    await db.delete(users).where(eq(users.id, target.id)).execute();
    return { success: true };
});
