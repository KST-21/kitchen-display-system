import Link from "next/link";
import { updateQueueAction } from "@/app/actions";
import { SortHeader } from "@/components/SortHeader";
import { parseSortParams, sort } from "@/lib/utils/sort";
import { listChefs, listKitchenQueue } from "@/lib/kitchen-db";
import { QUEUE_STATUSES } from "@/lib/constants/status";
import { requireRole } from "@/lib/require-role";
import { format } from "date-fns";
import { QueueSelects } from "@/components/QueueSelects";

const QueuePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ sortKey?: string; dir?: string }>;
}) => {
  await requireRole(["ADMIN", "STAFF"]);

  const sp = await searchParams;
  const allRows = await listKitchenQueue();
  const chefs = await listChefs();
  const { sortKey, dir } = parseSortParams(sp);
  const rows = sort(allRows, sortKey, dir, {
    queueNumber: (r) => r.queueNumber,
    item_name: (r) => r.item_name,
    quantity: (r) => r.quantity,
    special_request: (r) => r.special_request ?? "",
    table_number: (r) => r.table_number,
    chef_name: (r) => r.chef_name ?? "",
    Status: (r) => r.Status,
    created_at: (r) => r.created_at,
  });

  const sh = (col: string, label: string) => (
    <SortHeader
      basePath="/manage-queue"
      column={col}
      label={label}
      currentSort={sortKey}
      currentDir={dir}
    />
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Manage queue
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        One queue row per order. Assign chefs and prep status. For a full-screen
        pass board, open{" "}
        <Link
          href="/display/kitchen-queue"
          className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
        >
          Kitchen queue display
        </Link>
        .
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <caption className="sr-only">
            Kitchen queue: ticket numbers, table, chef assignment, prep and
            order status
          </caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              {sh("queueNumber", "#")}
              {sh("item_name", "Item")}
              {sh("quantity", "Qty")}
              {sh("special_request", "Notes")}
              {sh("table_number", "Table")}
              {sh("chef_name", "Chef")}
              {sh("Status", "Status")}
              {sh("created_at", "Queued at")}
              <th className="px-3 py-3 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  Queue is empty. New orders appear here automatically when you
                  place them.
                </td>
              </tr>
            ) : null}
            {rows.map((r) => (
              <tr
                key={r.queue_id}
                className="align-middle hover:bg-slate-50/80"
              >
                <td className="px-3 py-3 tabular-nums text-slate-500">
                  {r.queueNumber}
                </td>

                <td className="px-3 py-3 font-medium">{r.item_name}</td>

                <td className="px-3 py-3">{r.quantity}</td>

                <td className="px-3 py-3 text-slate-600">
                  {r.special_request ?? "—"}
                </td>

                <td className="px-3 py-3 font-medium">{r.table_number}</td>

                <td className="px-3 py-3 text-slate-600">
                  {r.chef_name ?? "—"}
                </td>

                <td className="px-3 py-3 text-slate-700">{r.Status}</td>

                <td className="px-3 py-3 text-xs text-slate-500">
                  {format(new Date(r.created_at), "yyyy-MM-dd p")}
                </td>

                <td className="px-3 py-3 text-right">
                  <QueueSelects
                    queueId={r.queue_id}
                    currentChefId={r.chef_id}
                    currentStatus={r.Status}
                    chefs={chefs}
                    statuses={QUEUE_STATUSES}
                    action={updateQueueAction}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueuePage;
