import crypto from 'node:crypto';
import { mcpTokens } from '../../database/schema';
import { db } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);
    if (!session.user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    const user = session.user as { id: number };
    
    try {
        const body = await readBody(event);
        const label = body?.label || 'Token via API';

        const rawToken = crypto.randomBytes(32).toString('hex');
        const id = crypto.randomUUID();

        await (db.insert(mcpTokens as any)
            .values({
                id,
                userId: user.id,
                token: rawToken,
                label,
            }) as any);
        
        const config = useRuntimeConfig();
        const mcpUrl = `${config.baseUrl}/api/mcp?token=${rawToken}`;
        
        return {
            id,
            label,
            mcpUrl,
            token: rawToken
        };
    } catch (e) {
        throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' });
    }
});
