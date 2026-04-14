"use client";

import { createOrderAction } from "@/app/actions";
import { MenuItem, RestaurantTable } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
  const available = menu.filter((m) => m.is_available);
  const [tableId, setTableId] = useState(String(tables[0]?.table_id ?? ""));
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState(String(available[0]?.menu_id ?? ""));
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lines.length) return;
    const fd = new FormData();
    fd.set("table_id", tableId);
    fd.set("lines", JSON.stringify(lines));
    startTransition(async () => {
      const result = await createOrderAction(fd);
      if (result.ok) {
        setLines([]);
        setOrderError(null);
        router.refresh();
      } else {
        setOrderError(result.message);
      }
    });
  };

  const addLine = () => {
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
  };

  const removeAt = (i: number) => {
    setLines((prev) => prev.filter((_, j) => j !== i));
  };

  const nameOf = (id: number) =>
    menu.find((m) => m.menu_id === id)?.item_name ?? `#${id}`;

  if (!tables.length || !available.length) {
    return (
      <p className="text-sm text-amber-800">
        Add at least one table and one available menu item first (Tables and
        Menu).
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-busy={pending}
    >
      <h3 className="text-sm font-medium text-slate-900">New order (staff)</h3>
      <p className="mt-1 text-xs text-slate-500">
        Guests usually order from the QR on the Tables page; use this for
        walk-ups or fixes.
      </p>
      {orderError ? (
        <p
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {orderError}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Table
          <select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {tables.map((t) => (
              <option key={t.table_id} value={t.table_id}>
                Table {t.table_number} ({t.status})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-6">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Menu item
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {available.map((m) => (
              <option key={m.menu_id} value={m.menu_id}>
                {m.item_name} (${m.price.toFixed(2)})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Qty
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Special request
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="e.g. no peanuts"
          />
        </label>
        <button
          type="button"
          onClick={addLine}
          className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300"
        >
          Add line
        </button>
      </div>

      {lines.length > 0 ? (
        <ul className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
          {lines.map((ln, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                {nameOf(ln.menuId)} ×{ln.quantity}
                {ln.specialRequest ? (
                  <span className="text-slate-600"> — {ln.specialRequest}</span>
                ) : null}
              </span>
              <button
                type="button"
                className="text-red-600 hover:underline"
                onClick={() => removeAt(i)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Cart is empty — add lines above.
        </p>
      )}

      <button
        type="submit"
        disabled={!lines.length || pending}
        className="mt-6 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Placing order…" : "Place order"}
      </button>
    </form>
  );
};
