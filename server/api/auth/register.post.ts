import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    // Rate limit: 3 registrations per hour per IP
    await defineRateLimit({ max: 3, window: 3600 })(event);

    const { email, password, name } = await validateBody(event, registerSchema);

    // Check if user already exists
    const existingUser = await fetchOne(db.select().from(users as any).where(eq((users as any).email, email)));
    if (existingUser) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Email already in use',
        });
    }

    const passwordHash = await hash(password, 10);

    // Registration is open; admins are promoted manually (or migrated from V1).
    const newUser = await fetchOne(db.insert(users as any).values({
        email,
        name,
        passwordHash,
    } as any).returning());

    if (!newUser) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Error creating user',
        });
    }

    return { user: await createUserSession(event, newUser) };
});
