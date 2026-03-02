import { hash, compare } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const body = await readBody(event);
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Current and new password are required',
        });
    }

    if (newPassword.length < 8) {
        throw createError({
            statusCode: 400,
            statusMessage: 'New password must be at least 8 characters long',
        });
    }

    const userSession = session.user as { id: number; email: string; name: string };

    // Use any to avoid dialect mismatch issues in TS
    const dbAny = db as any;
    const usersAny = users as any;

    // Get user from DB to verify current password
    const user = await fetchOne(dbAny.select().from(usersAny).where(eq(usersAny.id, userSession.id)));

    if (!user) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
        });
    }

    const isCorrect = await compare(currentPassword, user.password);
    if (!isCorrect) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Current password is incorrect',
        });
    }

    const hashedNewPassword = await hash(newPassword, 10);

    await dbAny.update(usersAny)
        .set({ password: hashedNewPassword })
        .where(eq(usersAny.id, user.id))
        .execute();

    return { message: 'Password updated successfully' };
});
