import { eq } from 'drizzle-orm';
import { sessions } from '../database/schema';
import { db } from '../utils/db';

// Runs on every clearUserSession() call, regardless of entry point (our
// /api/auth/logout, or the built-in /api/_auth/session DELETE route used by
// useUserSession().clear() in TheSidebar.vue) — deletes the matching device
// row so a cleared cookie can't be confused with a still-valid session.
export default defineNitroPlugin(() => {
    sessionHooks.hook('clear', async (session) => {
        const sessionId = session.sessionId;
        if (!sessionId) return;
        await db.delete(sessions as any).where(eq((sessions as any).id, sessionId)).execute();
    });
});
