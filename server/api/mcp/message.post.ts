export default defineEventHandler(async (event) => {
    const sessionId = getQuery(event).sessionId as string;
    if (!sessionId) throw createError({ statusCode: 400, statusMessage: 'Missing sessionId' });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transport = (globalThis as any).mcpTransports?.get(sessionId);
    if (!transport) throw createError({ statusCode: 404, statusMessage: 'Session not found' });
    
    const body = await readBody(event);
    await transport.handlePostMessage(body);
    
    return 'ok';
});
