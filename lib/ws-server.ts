/**
 * Singleton WebSocket server running alongside Next.js dev/prod.
 * Broadcasts kitchen state (queue rows + chefs) to all connected clients
 * whenever data changes.
 */

import { WebSocketServer, WebSocket } from "ws";
import { listChefs, listKitchenQueue } from "@/lib/kitchen-db";

const WS_PORT = Number(process.env.WS_PORT) || 3001;

const globalForWs = globalThis as unknown as {
  __kitchenWss?: WebSocketServer;
  __kitchenWsReady?: boolean;
};

function getOrCreateWss(): WebSocketServer {
  if (globalForWs.__kitchenWss) return globalForWs.__kitchenWss;

  const wss = new WebSocketServer({ port: WS_PORT });
  globalForWs.__kitchenWss = wss;
  globalForWs.__kitchenWsReady = true;

  wss.on("listening", () => {
    console.log(`[ws] Kitchen WebSocket server listening on ws://localhost:${WS_PORT}`);
  });

  wss.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.log(`[ws] Port ${WS_PORT} already in use — reusing existing WS server`);
      globalForWs.__kitchenWsReady = true;
    } else {
      console.error("[ws] WebSocket server error:", err);
    }
  });

  wss.on("connection", (ws) => {
    try {
      const payload = JSON.stringify({
        type: "state",
        rows: listKitchenQueue(),
        chefs: listChefs(),
      });
      ws.send(payload);
    } catch {
      // DB not ready yet
    }
  });

  return wss;
}

/** Broadcast current kitchen state to every connected client. */
export function broadcastKitchenState() {
  const wss = getOrCreateWss();
  let payload: string;
  try {
    payload = JSON.stringify({
      type: "state",
      rows: listKitchenQueue(),
      chefs: listChefs(),
    });
  } catch {
    return;
  }

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/** Ensure WS server is started (call from server actions / API routes). */
export function ensureWsServer() {
  getOrCreateWss();
}
