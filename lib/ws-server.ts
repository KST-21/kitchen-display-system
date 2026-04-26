import { WebSocketServer, WebSocket } from "ws";
import { listChefs, listKitchenQueue } from "@/lib/kitchen-db";

const PORT = Number(process.env.WS_PORT || 3001);

/**
 * MODE:
 * - "local"  → Next.js dev (shared process)
 * - "railway" → standalone WS server
 */
const MODE = process.env.WS_MODE || "local";

const globalForWs = globalThis as unknown as {
  __wss?: WebSocketServer;
};

const createServer = () => {
  if (globalForWs.__wss) return globalForWs.__wss;

  const wss = new WebSocketServer({ port: PORT });
  globalForWs.__wss = wss;

  console.log(`[ws] Server starting in ${MODE} mode on port ${PORT}`);

  wss.on("connection", async (ws) => {
    try {
      const payload = JSON.stringify({
        type: "state",
        rows: await listKitchenQueue(),
        chefs: await listChefs(),
      });

      ws.send(payload);
    } catch (err) {
      console.error("[ws] connection init error:", err);
    }
  });

  wss.on("listening", () => {
    console.log(`[ws] listening on ws://0.0.0.0:${PORT}`);
  });

  wss.on("error", (err) => {
    console.error("[ws] error:", err);
  });

  return wss;
};

/**
 * Only start server when appropriate
 */
export const ensureWsServer = () => {
  if (MODE === "railway") return; // Railway runs separate process

  createServer();
};

/**
 * Broadcast helper (safe for both modes)
 */
export const broadcastKitchenState = async () => {
  const wss = createServer();

  const payload = JSON.stringify({
    type: "state",
    rows: await listKitchenQueue(),
    chefs: await listChefs(),
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};
