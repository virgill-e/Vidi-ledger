import type { H3Event } from 'h3';
import { eq } from 'drizzle-orm';
import { users } from '../database/schema';
import { db, fetchOne } from './db';

/**
 * The account an admin action targets (`:id`). Admin accounts, the caller's
 * included, are off-limits: an admin cannot take over or delete another
 * admin, nor lock themselves out. Throws 400/403/404. Auto-imported.
 */
export const requireManageableUser = async (event: H3Event) => {
    const admin = await requireAdmin(event);
    const id = Number(getRouterParam(event, 'id'));
    if (!Number.isInteger(id) || id <= 0) {
        throw createError({ statusCode: 400, statusMessage: 'A valid user id is required' });
    }
    const target = await fetchOne(db.select().from(users).where(eq(users.id, id)));
    if (!target) throw createError({ statusCode: 404, statusMessage: 'User not found' });
    if (target.isAdmin || target.id === admin.id) {
        throw createError({ statusCode: 403, statusMessage: 'Admin accounts cannot be managed here' });
    }
    return { admin, target };
};
