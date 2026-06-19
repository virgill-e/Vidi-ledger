import type { H3Event } from 'h3';

/**
 * Shape of the authenticated user stored in the session.
 * Mirrors the `#auth-utils` User augmentation in `types/auth.d.ts`; declared
 * here too so the single cast below is the one place this shape is asserted.
 */
export interface SessionUser {
    id: number;
    email: string;
    name: string;
    role: string;
}

/**
 * Require an authenticated user.
 * Throws 401 if there is no session user. Returns the typed session user
 * (`{ id, email, name, role }`) so handlers don't need to re-cast it.
 *
 * Auto-imported by Nitro (like `defineRateLimit` / `validateBody`).
 */
export const requireAuth = async (event: H3Event): Promise<SessionUser> => {
    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }
    return session.user as SessionUser;
};

/**
 * Require an authenticated admin.
 * Throws 401 if not logged in, 403 if the user is not an admin.
 */
export const requireAdmin = async (event: H3Event): Promise<SessionUser> => {
    const user = await requireAuth(event);
    if (user.role !== 'admin') {
        throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Admin access required',
        });
    }
    return user;
};
