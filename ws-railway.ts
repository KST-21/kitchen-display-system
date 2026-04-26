import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { listChefs, listKitchenQueue } from "./lib/kitchen-db";

const PORT = Number(process.env.PORT || 3001);

const server = http.createServer();

const wss = new WebSocketServer({ server });

console.log(`[railway-ws] starting on port ${PORT}`);

wss.on("connection", async (ws) => {
  try {
    const payload = JSON.stringify({
      type: "state",
      rows: await listKitchenQueue(),
      chefs: await listChefs(),
    });

    ws.send(payload);
  } catch (err) {
    console.error("[ws] connection error:", err);
  }
});

export const broadcastKitchenState = async () => {
  try {
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
  } catch (err) {
    console.error("[ws] broadcast error:", err);
  }
};

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[railway-ws] listening on ws://0.0.0.0:${PORT}`);
});

setInterval(() => {}, 1000 * 60 * 10);
