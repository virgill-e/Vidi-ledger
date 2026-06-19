import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const user = await requireAuth(event);

    const { name } = await validateBody(event, profileUpdateSchema);

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
