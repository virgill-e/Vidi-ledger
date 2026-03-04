import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../../../../../../database/schema';
import { db, fetchOne } from '../../../../../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    if (session.user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Admin access required',
        });
    }

    const id = getRouterParam(event, 'id');
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'User ID is required',
        });
    }

    const targetId = Number(id);

    // Generate random 10 character password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let newRawPassword = '';
    for (let i = 0; i < 10; i++) {
        newRawPassword += chars.charAt(Math.floor(Math.random() * chars.length));
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
        newPassword: newRawPassword, // Provide it to admin so they can share it
    };
});
