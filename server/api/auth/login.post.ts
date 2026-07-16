import { compare } from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { users, sessions } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    // Rate limit: 5 attempts per minute
    await defineRateLimit({ max: 5, window: 60 })(event);

    const { email, password } = await validateBody(event, loginSchema);

    // Find user
    const user = await fetchOne(db.select().from(users as any).where(eq((users as any).email, email)));
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials',
        });
    }

    // Compare password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid credentials',
        });
    }

    // Create a device row so this session can be listed/revoked independently
    // of any other device the user is logged in on.
    const sessionId = randomUUID();
    const now = new Date();
    await db.insert(sessions as any).values({
        id: sessionId,
        userId: user.id,
        userAgent: getHeader(event, 'user-agent') || null,
        ipAddress: getRequestIP(event) || null,
        createdAt: now,
        lastActiveAt: now,
        expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000),
    } as any).execute();

    await setUserSession(event, {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        sessionId,
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
});
