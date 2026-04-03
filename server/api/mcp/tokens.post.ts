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
        const protocol = getRequestProtocol(event);
        const host = getRequestHost(event);
        const requestBaseUrl = `${protocol}://${host}`;

        // Utilise la baseUrl de la config si elle n'est pas le localhost par défaut,
        // sinon utilise l'URL détectée de la requête (plus fiable en prod si BASE_URL non défini).
        const finalBaseUrl = (config.baseUrl === 'http://localhost:3000' || !config.baseUrl) 
            ? requestBaseUrl 
            : config.baseUrl;

        const mcpUrl = `${finalBaseUrl}/api/mcp?token=${rawToken}`;
        
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
