import { QueueDisplayBoard } from "@/components/QueueDisplayBoard";
import { listChefs, listKitchenQueue } from "@/lib/kitchen-db";
import { ensureWsServer } from "@/lib/ws-server";

const QueueDisplayPage = () => {
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
};

export default QueueDisplayPage;
