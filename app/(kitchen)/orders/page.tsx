import { OrderForm } from "@/components/OrderForm";
import { listMenuItems, listOccupiedTables } from "@/lib/kitchen-db";
import { requireRole } from "@/lib/require-role";
import {
  listActiveSessionsAction,
  getSessionDetailsAction,
} from "@/app/actions";
import Link from "next/link";

const OrdersPage = async () => {
  await requireRole(["ADMIN", "STAFF"]);

  const sessions = await listActiveSessionsAction();
  const tables = await listOccupiedTables();
  const menu = await listMenuItems();

  const sessionData = await Promise.all(
    sessions.map(async (s) => {
      const details = await getSessionDetailsAction(s.session_id);
      return { session: s, ...details };
    }),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-2xl font-semibold text-slate-900">Orders</h2>

      <div className="mt-8">
        <OrderForm tables={tables} menu={menu} />
      </div>

      <h3 className="mt-12 text-lg font-medium text-slate-900">
        Active sessions
      </h3>

      <div className="mt-4 space-y-6">
        {!sessionData.length ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            <h3 className="font-semibold">No active sessions</h3>
            <p className="mt-1">
              There are currently no active table sessions. Set a table to{" "}
              <span className="font-medium">Occupied</span> to begin a session
              and start taking orders.
            </p>

            <p className="mt-3 text-xs text-amber-700">
              Active sessions represent tables that are currently in use. Orders
              and pre-bills are grouped under these sessions.
            </p>
          </div>
        ) : (
          sessionData.map(({ session, items, subtotal }) => (
            <div
              key={session.session_id}
              className="rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    Table {session.table_id}
                    <span className="text-slate-500">
                      {" "}
                      · {new Date(session.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-sm text-slate-500">
                    Session #{session.session_id}
                  </div>
                </div>

                <Link
                  href={`/print/pre-bill/${session.session_id}`}
                  target="_blank"
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                >
                  Print Pre-bill
                </Link>
              </div>

              {/* Items */}
              <ul className="mt-4 border-t pt-4 text-sm">
                {items.map((i, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{i.item_name}</span> ×{" "}
                    {i.quantity}
                    <span className="float-right">
                      ${(i.price * i.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 text-right font-medium">
                Subtotal: ${subtotal.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
