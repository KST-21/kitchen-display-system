import { updateOrderStatusAction } from "@/app/actions";
import { OrderForm } from "@/components/OrderForm";
import {
  listMenuItems,
  listOrders,
  listTables,
  mapOrderIdToLines,
} from "@/lib/kitchen-db";

const STATUSES = ["Pending", "In progress", "Completed", "Cancelled"] as const;

const OrdersPage = async () => {
  const orders = await listOrders();
  const linesByOrder = await mapOrderIdToLines();
  const tables = await listTables();
  const menu = await listMenuItems();

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Orders
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Orders by table, line items, and order-level status.
      </p>

      <div className="mt-8">
        <OrderForm tables={tables} menu={menu} />
      </div>

      <h3 className="mt-12 text-lg font-medium text-slate-900">
        Recent orders
      </h3>
      <div className="mt-4 space-y-6">
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
            No orders yet. Place one above, use guest QR ordering, or load test
            data from the dashboard.
          </p>
        ) : null}
        {orders.map((o) => {
          const lines = linesByOrder.get(o.order_id) ?? [];
          const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
          return (
            <div
              key={o.order_id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900">
                    Order #{o.order_id}
                    {o.order_number != null ? (
                      <span className="font-normal text-slate-500">
                        {" "}
                        · #{o.order_number}
                      </span>
                    ) : null}{" "}
                    <span className="font-normal text-slate-500">
                      · {o.created_at}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Table {o.table_number}
                  </div>
                </div>
                <form
                  action={updateOrderStatusAction}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="order_id" value={o.order_id} />
                  <select
                    name="order_status"
                    defaultValue={o.order_status}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Update status
                  </button>
                </form>
              </div>
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                {lines.map((l) => (
                  <li key={l.order_item_id}>
                    <span className="font-medium">{l.item_name}</span> ×
                    {l.quantity}
                    {l.special_request ? (
                      <span className="text-slate-600">
                        {" "}
                        — {l.special_request}
                      </span>
                    ) : null}
                    <span className="float-right tabular-nums text-slate-700">
                      ${(l.price * l.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-right text-sm font-medium text-slate-900">
                Subtotal: ${subtotal.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersPage;
