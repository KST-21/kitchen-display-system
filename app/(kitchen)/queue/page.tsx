import Link from "next/link";
import { updateQueueAction } from "@/app/actions";
import { SortHeader } from "@/components/SortHeader";
import { parseSortParams, sort } from "@/lib/utils/sort";
import { listChefs, listKitchenQueue } from "@/lib/kitchen-db";

const QSTATUSES = ["Queued", "Preparing", "Ready", "Served"] as const;

const QueuePage = async ({
  searchParams,
}: {
  searchParams: Promise<{ sortKey?: string; dir?: string }>;
}) => {
  const sp = await searchParams;
  const allRows = await listKitchenQueue();
  const chefs = await listChefs();
  const { sortKey, dir } = parseSortParams(sp);
  const rows = sort(allRows, sortKey, dir, {
    queueNumber: (r) => r.queueNumber,
    order_id: (r) => r.order_id,
    table_number: (r) => r.table_number,
    chef_name: (r) => r.chef_name ?? "",
    Status: (r) => r.Status,
    order_status: (r) => r.order_status,
    created_at: (r) => r.created_at,
  });

  const sh = (col: string, label: string) => (
    <SortHeader
      basePath="/queue"
      column={col}
      label={label}
      currentSort={sortKey}
      currentDir={dir}
    />
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Kitchen queue
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        One queue row per order. Assign chefs and prep status. For a full-screen
        pass board, open{" "}
        <Link
          href="/display/queue"
          className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-500"
        >
          queue display
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
              {sh("order_id", "Order")}
              {sh("table_number", "Table")}
              {sh("chef_name", "Chef")}
              {sh("Status", "Prep status")}
              {sh("order_status", "Order status")}
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
                <td className="px-3 py-3 font-medium tabular-nums">
                  {r.order_id}
                </td>
                <td className="px-3 py-3 font-medium">{r.table_number}</td>
                <td className="px-3 py-3 text-slate-600">
                  {r.chef_name ?? "—"}
                </td>
                <td className="px-3 py-3 text-slate-700">{r.Status}</td>
                <td className="px-3 py-3">{r.order_status}</td>
                <td className="px-3 py-3 text-xs text-slate-500">
                  {r.created_at}
                </td>
                <td className="px-3 py-3 text-right">
                  <form
                    action={updateQueueAction}
                    className="inline-flex flex-wrap items-center justify-end gap-2"
                  >
                    <input type="hidden" name="queue_id" value={r.queue_id} />
                    <select
                      name="chef_id"
                      defaultValue={r.chef_id ?? ""}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                      aria-label={`Chef for ticket ${r.queueNumber}`}
                    >
                      <option value="">Unassigned</option>
                      {chefs.map((c) => (
                        <option key={c.chef_id} value={c.chef_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      name="queue_status"
                      defaultValue={r.Status}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                      aria-label={`Prep status for ticket ${r.queueNumber}`}
                    >
                      {QSTATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Apply
                    </button>
                  </form>
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
