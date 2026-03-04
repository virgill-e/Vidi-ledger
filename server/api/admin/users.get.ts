import { desc } from 'drizzle-orm';
import { users } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    if (session.user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Admin access required',
        });
    }

    const allUsers = await fetchAll(db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt
    } as any).from(users as any).orderBy(desc((users as any).createdAt)));

    return allUsers;
});
