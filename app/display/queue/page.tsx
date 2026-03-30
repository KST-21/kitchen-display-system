import { QueueDisplayBoard } from "@/components/QueueDisplayBoard";
import { listChefs, listKitchenQueue } from "@/lib/kitchen-db";
import { ensureWsServer } from "@/lib/ws-server";

export default function QueueDisplayPage() {
  ensureWsServer();
  const initialRows = listKitchenQueue();
  const initialChefs = listChefs();
  return (
    <QueueDisplayBoard
      initialRows={initialRows}
      initialChefs={initialChefs}
      wsPort={Number(process.env.WS_PORT) || 3001}
      pollIntervalSeconds={10}
    />
  );
}
