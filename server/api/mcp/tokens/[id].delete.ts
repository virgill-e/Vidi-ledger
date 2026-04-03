import { eq, and } from 'drizzle-orm';
import { mcpTokens } from '../../../database/schema';
import { db } from '../../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    const user = session.user as { id: number };

    const id = getRouterParam(event, 'id');
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' });

    try {
        await (db.update(mcpTokens as any)
            .set({ revokedAt: new Date() })
            .where(
                and(
                    eq((mcpTokens as any).id, id),
                    eq((mcpTokens as any).userId, user.id)
                )
            ) as any);
        
        return { success: true };
    } catch (e) {
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});
