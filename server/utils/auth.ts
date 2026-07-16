import type { H3Event } from 'h3';
import { eq } from 'drizzle-orm';
import { sessions } from '../database/schema';
import { db, fetchOne } from './db';

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

// Must match nuxt.config.ts `runtimeConfig.session.maxAge`. Also used as the
// sliding window written to `sessions.expiresAt` on login and on renewal.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// How long a device can stay idle before its next request pays the cost of
// renewing the DB row + resealing the cookie (avoids a write on every request).
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24; // 1 day

/**
 * Require an authenticated user.
 * Throws 401 if there is no session, or if the session's device row was
 * revoked/expired server-side (logout-elsewhere, "end session" from another
 * device, or the sliding window lapsing from inactivity).
 * On success, slides the session forward if it's getting old.
 * Returns the typed session user (`{ id, email, name, role }`) so handlers
 * don't need to re-cast it.
 *
 * Auto-imported by Nitro (like `defineRateLimit` / `validateBody`).
 */
export const requireAuth = async (event: H3Event): Promise<SessionUser> => {
    const session = await getUserSession(event);
    if (!session.user || !session.sessionId) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const sessionsAny = sessions as any;
    const dbSession = await fetchOne(
        db.select().from(sessionsAny).where(eq(sessionsAny.id, session.sessionId)),
    );

    if (!dbSession || dbSession.expiresAt.getTime() < Date.now()) {
        await clearUserSession(event);
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const now = new Date();
    if (now.getTime() - dbSession.lastActiveAt.getTime() > SESSION_RENEW_THRESHOLD_MS) {
        const newExpiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
        await (db as any)
            .update(sessionsAny)
            .set({ lastActiveAt: now, expiresAt: newExpiresAt })
            .where(eq(sessionsAny.id, session.sessionId))
            .execute();

        // Reseal the cookie too: h3 pins the cookie's own expiry to its
        // creation time, so only replaceUserSession (not setUserSession)
        // actually pushes it forward.
        await replaceUserSession(event, {
            user: session.user,
            sessionId: session.sessionId,
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
