export default defineEventHandler(async (event) => {
    const sessionId = getQuery(event).sessionId as string;
    console.log(`[MCP] Message reçu pour la session: ${sessionId}`);

    if (!sessionId) {
        console.error('[MCP] Message rejeté: SessionID manquant');
        throw createError({ statusCode: 400, statusMessage: 'Missing sessionId' });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transport = (globalThis as any).mcpTransports?.get(sessionId);
    if (!transport) {
        console.error(`[MCP] Message rejeté: Session ${sessionId} non trouvée`);
        throw createError({ statusCode: 404, statusMessage: 'Session not found' });
    }
    
    const body = await readBody(event);
    console.log(`[MCP] Payload message: ${JSON.stringify(body).slice(0, 100)}...`);
    
    // SSEServerTransport.handlePostMessage(req, res, parsedBody)
    await transport.handlePostMessage(event.node.req, event.node.res, body);
    
    return 'ok';
});
