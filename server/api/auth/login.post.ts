import { compare } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
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

    // Create session
    await setUserSession(event, {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
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
