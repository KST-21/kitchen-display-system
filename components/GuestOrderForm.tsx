"use client";

import { createGuestOrderByQrAction } from "@/app/actions";
import type { MenuItem } from "@/lib/kitchen-db";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

type Line = { menuId: number; quantity: number; specialRequest: string };

const MenuTileImage = ({ src, alt }: { src: string | null; alt: string }) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 text-3xl"
        aria-hidden
      >
        🍽️
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- guest URLs may be any host; lazy + onError fallback
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
};

export const GuestOrderForm = ({
  qrToken,
  menu,
  tableNumber,
}: {
  qrToken: string;
  menu: MenuItem[];
  tableNumber: string;
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [orderError, setOrderError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const available = useMemo(() => menu.filter((m) => m.is_available), [menu]);
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState(String(available[0]?.menu_id ?? ""));
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  const selected = useMemo(
    () => available.find((m) => String(m.menu_id) === pick) ?? available[0],
    [available, pick],
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!lines.length) return;
      const fd = new FormData();
      fd.set("qr_token", qrToken);
      fd.set("lines", JSON.stringify(lines));
      startTransition(async () => {
        const result = await createGuestOrderByQrAction(fd);
        if (result.ok) {
          setLines([]);
          setOrderError(null);
          setSuccess(true);
          router.refresh();
        } else {
          setOrderError(result.message);
        }
      });
    },
    [lines, qrToken, router],
  );

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

  const removeAt = useCallback((i: number) => {
    setLines((prev) => prev.filter((_, j) => j !== i));
  }, []);

  const itemById = useCallback(
    (id: number) => menu.find((m) => m.menu_id === id),
    [menu],
  );

  const nameOf = (id: number) => itemById(id)?.item_name ?? `#${id}`;

  if (!available.length) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm text-amber-900">
        Menu is not available right now. Please ask a team member.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/[0.04] backdrop-blur-sm"
      aria-busy={pending}
    >
      {success ? (
        <p
          className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 text-center text-sm font-medium text-emerald-900"
          role="status"
        >
          Order sent for table {tableNumber}. Thank you — the kitchen has your
          ticket.
        </p>
      ) : null}
      {orderError ? (
        <p
          className="border-b border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-800"
          role="alert"
        >
          {orderError}
        </p>
      ) : null}

      <div className="p-4 sm:p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Menu
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Tap an item to select, then add to your order.
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
          {available.map((m) => {
            const isSel = String(m.menu_id) === pick;
            return (
              <li key={m.menu_id}>
                <button
                  type="button"
                  onClick={() => setPick(String(m.menu_id))}
                  aria-label={`${m.item_name}, $${m.price.toFixed(2)}${isSel ? ", selected" : ", select item"}`}
                  className={`group relative w-full overflow-hidden rounded-2xl border-2 text-left transition duration-200 active:scale-[0.98] ${
                    isSel
                      ? "border-amber-500 bg-amber-50/50 shadow-md shadow-amber-900/10 ring-2 ring-amber-400/30"
                      : "border-slate-200/90 bg-white hover:border-amber-200 hover:shadow-md"
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <MenuTileImage src={m.image_url} alt="" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 pb-2 pt-8">
                      <p className="line-clamp-2 text-xs font-semibold leading-tight text-white drop-shadow-sm sm:text-sm">
                        {m.item_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      ${m.price.toFixed(2)}
                    </span>
                    {isSel ? (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Selected
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Tap
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {selected ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
            <div className="flex gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white shadow-sm">
                <MenuTileImage
                  src={selected.image_url}
                  alt={selected.item_name}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-slate-900">
                  {selected.item_name}
                </p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-amber-700">
                  ${selected.price.toFixed(2)} each
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
                Qty
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
                />
              </label>
              <label className="flex min-w-[8rem] flex-1 flex-col gap-1 text-xs font-semibold text-slate-600">
                Note{" "}
                <span className="font-normal text-slate-400">(optional)</span>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
                  placeholder="Allergies, spice level…"
                />
              </label>
              <button
                type="button"
                onClick={addLine}
                className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-900/20 transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.98]"
              >
                Add to order
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-4 sm:px-5">
        {lines.length > 0 ? (
          <ul className="space-y-3">
            {lines.map((ln, i) => {
              const mi = itemById(ln.menuId);
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 pr-3 shadow-sm"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <MenuTileImage src={mi?.image_url ?? null} alt="" />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-slate-900">
                      {nameOf(ln.menuId)}{" "}
                      <span className="font-bold tabular-nums text-amber-800">
                        ×{ln.quantity}
                      </span>
                    </p>
                    {ln.specialRequest ? (
                      <p className="mt-0.5 text-xs text-slate-600">
                        {ln.specialRequest}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    onClick={() => removeAt(i)}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-center text-sm text-slate-500">
            Your order is empty — pick something tasty above.
          </p>
        )}

        <button
          type="submit"
          disabled={!lines.length || pending}
          className="mt-4 w-full rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/25 transition hover:from-slate-800 hover:to-slate-900 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
        >
          {pending ? "Sending…" : "Send order to kitchen"}
        </button>
      </div>
    </form>
  );
};
