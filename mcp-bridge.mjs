import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EventSource } from "eventsource";

// Polyfill global EventSource for the SDK
if (!globalThis.EventSource) {
    globalThis.EventSource = EventSource;
}

async function run() {
    const urlString = process.argv[2];
    if (!urlString) {
        process.stderr.write("Erreur: URL du serveur MCP manquante.\n");
        process.exit(1);
    }

    try {
        const url = new URL(urlString);
        process.stderr.write(`Bridge: Connexion à ${url.origin}${url.pathname}...\n`);

        const sse = new SSEClientTransport(url, {
            eventSource: EventSource
        });
        const stdio = new StdioServerTransport();

        // Relay messages from SSE (Vidi) to Stdio (Claude)
        sse.onmessage = (message) => {
            process.stderr.write(`[BRIDGE -> CLAUDE] ${JSON.stringify(message).slice(0, 80)}...\n`);
            stdio.send(message).catch(err => {
                process.stderr.write(`Bridge Error: Failed to send to stdio: ${err.message}\n`);
            });
        };

        // Relay messages from Stdio (Claude) to SSE (Vidi)
        stdio.onmessage = (message) => {
            process.stderr.write(`[CLAUDE -> BRIDGE] ${JSON.stringify(message).slice(0, 80)}...\n`);
            sse.send(message).catch(err => {
                process.stderr.write(`Bridge Error: Failed to send to SSE: ${err.message}\n`);
            });
        };

        sse.onerror = (error) => {
            process.stderr.write(`Bridge Error: SSE Error: ${error}\n`);
        };

        stdio.onerror = (error) => {
            process.stderr.write(`Bridge Error: Stdio Error: ${error}\n`);
        };

        // Start connections
        await Promise.all([
            sse.start(),
            stdio.start()
        ]);
        
        process.stderr.write("Bridge MCP: Connecté avec succès au serveur SSE et à l'entrée Stdio.\n");

    } catch (err) {
        process.stderr.write(`Bridge Error: Erreur fatale: ${err instanceof Error ? err.stack : err}\n`);
        process.exit(1);
    }
}

run();
