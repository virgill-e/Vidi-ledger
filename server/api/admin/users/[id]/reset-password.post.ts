import { hash } from 'bcrypt';
import { randomInt } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { users } from '../../../../database/schema';
import { db, fetchOne } from '../../../../utils/db';

export default defineEventHandler(async (event) => {
    // Rate limit: 10 resets per minute for the admin
    await defineRateLimit({ max: 10, window: 60 })(event);

    const session = await requireUserSession(event);
    if (session.user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Admin access required',
        });
    }

    const id = getRouterParam(event, 'id');
    const targetId = Number(id);
    if (!id || !Number.isInteger(targetId) || targetId <= 0) {
        throw createError({
            statusCode: 400,
            statusMessage: 'A valid user ID is required',
        });
    }

    // Fetch the user to check their role before resetting
    const targetUser = await fetchOne(db.select().from(users as any).where(eq((users as any).id, targetId)));

    if (!targetUser) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
        });
    }

    // Role check: cannot reset password of admin accounts
    if (targetUser.role === 'admin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Cannot reset password for admin accounts',
        });
    }

    // Generate a cryptographically secure random 12 character password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let newRawPassword = '';
    for (let i = 0; i < 12; i++) {
        newRawPassword += chars.charAt(randomInt(chars.length));
    }

    // Hash it for DB
    const hashedPassword = await hash(newRawPassword, 10);

    // Update user
    const updated = await fetchOne((db as any).update(users as any)
        .set({ password: hashedPassword })
        .where(eq((users as any).id, targetId))
        .returning());

    if (!updated) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found',
        });
    }

    return {
        success: true,
        newPassword: newRawPassword,
    };
});
