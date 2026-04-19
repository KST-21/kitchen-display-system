import {
  deleteTableAction,
  updateTableStatusAction,
  upsertTableAction,
} from "@/app/actions";
import { listTablesWithDeleteFlag, tableStatusCounts } from "@/lib/kitchen-db";
import { parseSortParams, sort } from "@/lib/utils/sort";
import Link from "next/link";
import { StatusSelect } from "@/components/StatusSelect";
import { TableCardMenu } from "@/components/TableCardMenu";
import { Role, TableStatus } from "@prisma/client";
import { TABLE_STATUSES } from "@/lib/constants/status";
import { hasRole, requireRole } from "@/lib/require-role";

type SP = {
  add?: string;
  edit?: string;
  error?: string;
  sortKey?: string;
  dir?: string;
};

const statusStyles: Record<
  TableStatus | "Total",
  { dot?: string; card: string }
> = {
  Total: {
    card: "bg-slate-100 text-slate-800",
  },
  Available: {
    dot: "bg-emerald-500",
    card: "bg-emerald-50 text-emerald-800",
  },
  Occupied: {
    dot: "bg-amber-500",
    card: "bg-amber-50 text-amber-800",
  },
  Reserved: {
    dot: "bg-sky-500",
    card: "bg-sky-50 text-sky-800",
  },
  Cleaning: {
    dot: "bg-slate-400",
    card: "bg-slate-50 text-slate-600",
  },
} as const;

const TablesPage = async ({ searchParams }: { searchParams: Promise<SP> }) => {
  await requireRole(["ADMIN", "STAFF"]);
  const isAdmin = await hasRole([Role.ADMIN]);
  const sp = await searchParams;
  const showAdd = sp.add === "1";
  const editId = sp.edit ? Number(sp.edit) : null;
  const allRows = await listTablesWithDeleteFlag();
  const editing = editId ? allRows.find((r) => r.table_id === editId) : null;
  const statusMap = await tableStatusCounts();
  const total = allRows.length;
  const { sortKey, dir } = parseSortParams(sp);
  const rows = sort(allRows, sortKey, dir, {
    table_id: (r) => r.table_id,
    table_number: (r) => r.table_number,
    status: (r) => r.status,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Tables
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Manage dining tables and QR codes. A new QR is generated when a table is
        set to Occupied.
      </p>

      {sp.error === "has_orders" ? (
        <div
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          Cannot delete a table that still has orders on record.
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-5">
        {[
          {
            label: "Total",
            value: total,
            color: statusStyles.Total.card,
          },
          {
            label: "Available",
            value: statusMap["Available"] ?? 0,
            color: statusStyles.Available.card,
          },
          {
            label: "Occupied",
            value: statusMap["Occupied"] ?? 0,
            color: statusStyles.Occupied.card,
          },
          {
            label: "Reserved",
            value: statusMap["Reserved"] ?? 0,
            color: statusStyles.Reserved.card,
          },
          {
            label: "Cleaning",
            value: statusMap["Cleaning"] ?? 0,
            color: statusStyles.Cleaning.card,
          },
        ].map((c) => (
          <div
            key={c.label}
            className={`rounded-xl px-4 py-3 text-center shadow-sm ring-1 ring-slate-200 ${c.color}`}
          >
            <div className="text-2xl font-bold tabular-nums">{c.value}</div>
            <div className="mt-0.5 text-xs font-medium uppercase tracking-wide">
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {isAdmin &&
        (showAdd || editing ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-900">
              {editing ? `Edit table ${editing.table_number}` : "Add new table"}
            </h3>
            <form
              action={upsertTableAction}
              className="mt-4 flex flex-wrap items-end gap-4"
            >
              {editing ? (
                <input type="hidden" name="table_id" value={editing.table_id} />
              ) : null}
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Table number
                <input
                  name="table_number"
                  required
                  placeholder="e.g. 13 or Patio-A"
                  defaultValue={editing?.table_number ?? ""}
                  className="w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Status
                <select
                  name="status"
                  defaultValue={editing?.status ?? "Available"}
                  className="w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {TABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-amber-400"
              >
                {editing ? "Save" : "Add table"}
              </button>
              <Link
                href="/tables"
                className="text-sm text-slate-600 underline hover:text-slate-900"
              >
                Cancel
              </Link>
            </form>
          </div>
        ) : (
          <div className="mt-6">
            <Link
              href="/tables?add=1"
              className="inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800"
            >
              + Add table
            </Link>
          </div>
        ))}

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((r) => {
          const isOccupied = r.status === TableStatus.Occupied;

          return (
            <div
              key={r.table_id}
              className="rounded-2xl border p-4 shadow-md flex flex-col gap-3 bg-white"
            >
              <div className="relative flex items-center justify-center">
                <h3 className="font-semibold text-slate-900">
                  Table {r.table_number}
                </h3>

                <div className="absolute right-0">
                  <TableCardMenu
                    tableId={r.table_id}
                    canDelete={r.can_delete}
                    isAdmin={isAdmin}
                    onDelete={deleteTableAction}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${statusStyles[r.status as TableStatus].dot}`}
                  />
                  {r.status}
                </div>

                <StatusSelect
                  tableId={r.table_id}
                  currentStatus={r.status}
                  action={updateTableStatusAction}
                  statuses={TABLE_STATUSES}
                />
              </div>

              {isOccupied ? (
                <Link
                  href={`/print/table/${r.table_id}`}
                  target="_blank"
                  className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
                >
                  Print QR
                </Link>
              ) : (
                <button
                  disabled
                  className="mt-2 w-full cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-500"
                >
                  Set to Occupied to Print QR
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TablesPage;
