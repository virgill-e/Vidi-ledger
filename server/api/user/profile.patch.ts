import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }

    const { name } = await readBody(event);

    if (!name) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Name is required',
        });
    }

    const user = session.user as { id: number; email: string; name: string };

    // Use a generic update call to avoid dialect mismatch issues in TS
    const dbAny = db as any;
    const usersAny = users as any;

    await dbAny.update(usersAny)
        .set({ name })
        .where(eq(usersAny.id, user.id))
        .execute();

    // Update session
    await setUserSession(event, {
        user: {
            ...user,
            name: name,
        },
    });

    return {
        user: {
            id: user.id,
            email: user.email,
            name: name,
        },
    };
});
