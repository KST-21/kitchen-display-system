import Link from "next/link";
import { ResetDatabaseButton } from "@/components/ResetDatabaseButton";
import { dashboardCounts } from "@/lib/kitchen-db";
import { seedIfEmptyAction } from "../actions";

export default function DashboardPage() {
  const s = dashboardCounts();
  const cards = [
    { label: "Tables", value: s.tables.c },
    { label: "Chefs", value: s.chefs.c },
    { label: "Menu items", value: s.menu.c },
    { label: "Orders", value: s.orders.c },
    { label: "Queue entries", value: s.queue.c },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {c.label}
            </div>
            <div className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Kitchen queue</h3>
        <p className="mt-1 text-sm text-slate-600">
          Manage assignments on the queue page, or open the large pass display on a second screen.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/queue"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800"
          >
            Kitchen queue
          </Link>
          <Link
            href="/display/queue"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
          >
            Queue display
          </Link>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <form action={seedIfEmptyAction}>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800"
          >
            Load full test data (if empty)
          </button>
        </form>
        <ResetDatabaseButton />
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Destructive reset clears all current data, then loads tables, chefs, menu, orders, and queue.
      </p>
    </div>
  );
}
