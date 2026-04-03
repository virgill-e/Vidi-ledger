import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EventSource } from "eventsource";

if (!globalThis.EventSource) {
    globalThis.EventSource = EventSource;
}

async function run() {
    const url = process.argv[2];
    if (!url) {
        console.error("Veuillez fournir l'URL du serveur MCP.");
        process.exit(1);
    }

    const sse = new SSEClientTransport(new URL(url));
    const stdio = new StdioServerTransport();

    // Quand le serveur SSE répond, on le transmet à Claude Desktop via stdio
    sse.onmessage = async (message) => {
        await stdio.send(message);
    };

    // Quand Claude Desktop envoie un message via stdio, on le transmet au serveur SSE
    stdio.onmessage = async (message) => {
        await sse.send(message);
    };

    sse.onerror = (error) => {
        console.error("Erreur SSE MCP Bridge:", error);
    };

    sse.onclose = () => {
        process.exit(0);
    };
    
    // Initialise les deux transports
    await sse.start();
}

run().catch((err) => {
    console.error("Erreur fatale bridge MCP:", err);
});
