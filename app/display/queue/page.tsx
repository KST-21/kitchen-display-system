import { QueueDisplayBoard } from "@/components/QueueDisplayBoard";
import { listChefs, listKitchenQueue } from "@/lib/kitchen-db";
import { requireRole } from "@/lib/require-role";
import { ensureWsServer } from "@/lib/ws-server";

const QueueDisplayPage = async () => {
  await requireRole(["ADMIN", "STAFF"]);
  ensureWsServer();
  const initialRows = await listKitchenQueue();
  const initialChefs = await listChefs();
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
