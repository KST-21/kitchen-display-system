"use client";

import { createOrderAction } from "@/app/actions";
import { MenuItem, RestaurantTable } from "@/lib/types";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { Minus, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

type Line = { menuId: number; quantity: number; specialRequest: string };

export const OrderForm = ({
  tables,
  menu,
}: {
  tables: RestaurantTable[];
  menu: MenuItem[];
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [orderError, setOrderError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const available = useMemo(() => menu.filter((m) => m.is_available), [menu]);
  const [tableId, setTableId] = useState(String(tables[0]?.table_id ?? ""));
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState(String(available[0]?.menu_id ?? ""));
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  const nameOf = useCallback(
    (id: number) => menu.find((m) => m.menu_id === id)?.item_name ?? `#${id}`,
    [menu],
  );

  const handleSubmitOrder = useCallback(() => {
    if (!lines.length) return;
    const fd = new FormData();
    fd.set("table_id", tableId);
    fd.set("lines", JSON.stringify(lines));
    startTransition(async () => {
      const result = await createOrderAction(fd);
      if (result.ok) {
        setLines([]);
        setOrderError(null);
        setOpen(false);
        router.refresh();
      } else {
        setOrderError(result.message);
      }
    });
  }, [lines, tableId, router]);

  const addLine = useCallback(() => {
    const menuId = Number(pick);
    const q = Math.max(1, parseInt(qty, 10) || 1);
    if (!Number.isFinite(menuId)) return;
    const noteTrim = note.trim();
    setLines((prev) => {
      const i = prev.findIndex((p) => p.menuId === menuId);
      if (i === -1) {
        return [...prev, { menuId, quantity: q, specialRequest: noteTrim }];
      }
      const next = [...prev];
      const cur = next[i]!;
      const mergedNote = [cur.specialRequest, noteTrim]
        .filter(Boolean)
        .join(" · ");
      next[i] = {
        ...cur,
        quantity: cur.quantity + q,
        specialRequest: mergedNote,
      };
      return next;
    });
    setNote("");
    setQty("1");
  }, [pick, qty, note]);

  const updateQuantity = useCallback((index: number, delta: number) => {
    setLines((prev) => {
      const next = [...prev];
      const item = next[index]!;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return next.filter((_, j) => j !== index);
      next[index] = { ...item, quantity: newQty };
      return next;
    });
  }, []);

  const removeAt = useCallback((i: number) => {
    setLines((prev) => prev.filter((_, j) => j !== i));
  }, []);

  if (!tables.length || !available.length) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <h3 className="font-semibold">No occupied tables</h3>
        <p className="mt-1">
          Set at least one table to{" "}
          <span className="font-medium">Occupied</span> to start placing orders.
        </p>

        <p className="mt-3 text-xs text-amber-700">
          This form is intended for staff use (e.g. walk-in customers or
          corrections). Guests typically place orders by scanning the QR code at
          their table.
        </p>
      </div>
    );
  }

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <AlertDialogPrimitive.Trigger asChild>
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800">
          + New order (staff)
        </button>
      </AlertDialogPrimitive.Trigger>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm outline-none sm:max-w-lg">
          <AlertDialogPrimitive.Title className="text-xl font-semibold tracking-tight text-slate-900">
            New Order
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-1 text-sm text-slate-600">
            For walk-ups or fixes. Guests usually order from the QR code.
          </AlertDialogPrimitive.Description>

          {orderError && (
            <div
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-800"
              role="alert"
            >
              {orderError}
            </div>
          )}

          <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Table
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                {tables.map((t) => (
                  <option key={t.table_id} value={t.table_id}>
                    Table {t.table_number} ({t.status})
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Add items
              </p>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Menu item
                <select
                  value={pick}
                  onChange={(e) => setPick(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  {available.map((m) => (
                    <option key={m.menu_id} value={m.menu_id}>
                      {m.item_name} (THB {m.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Qty
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-20 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
                <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Note
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. no peanuts"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={addLine}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                + Add line
              </button>
            </div>

            {lines.length > 0 ? (
              <ul className="space-y-2">
                {lines.map((ln, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {nameOf(ln.menuId)}
                      </p>
                      {ln.specialRequest && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {ln.specialRequest}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(i, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold tabular-nums text-slate-900">
                        {ln.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(i, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-slate-500">
                No items added yet.
              </p>
            )}
          </div>

          <div className="mt-5 flex gap-3">
            <AlertDialogPrimitive.Cancel className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Cancel
            </AlertDialogPrimitive.Cancel>
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={!lines.length || pending}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Placing…" : "Place order"}
            </button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
};
