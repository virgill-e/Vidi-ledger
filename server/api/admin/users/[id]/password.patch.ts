import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { sessions, users } from '../../../../database/schema';
import { db } from '../../../../utils/db';

// Sets a new password chosen by the admin and signs the user out everywhere.
export default defineEventHandler(async (event) => {
    await defineRateLimit({ max: 10, window: 60 })(event);
    const { target } = await requireManageableUser(event);
    const { password } = await validateBody(event, adminPasswordSchema);

    await db.update(users).set({ passwordHash: await hash(password, 10) }).where(eq(users.id, target.id)).execute();
    await db.delete(sessions).where(eq(sessions.userId, target.id)).execute();

    return { success: true };
});
