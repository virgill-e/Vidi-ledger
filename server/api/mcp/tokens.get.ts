import { eq, desc } from 'drizzle-orm';
import { mcpTokens } from '../../database/schema';
import { db, fetchAll } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    const user = session.user as { id: number };

    try {
        const tokens = await fetchAll(
            db.select({
                id: (mcpTokens as any).id,
                label: (mcpTokens as any).label,
                createdAt: (mcpTokens as any).createdAt,
                lastUsedAt: (mcpTokens as any).lastUsedAt,
                revokedAt: (mcpTokens as any).revokedAt,
            })
            .from(mcpTokens as any)
            .where(eq((mcpTokens as any).userId, user.id))
            .orderBy(desc((mcpTokens as any).createdAt))
        );

        return tokens;
    } catch (e) {
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});
