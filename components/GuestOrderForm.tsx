"use client";

import { createGuestOrderByQrAction } from "@/app/actions";
import { MenuItem } from "@/lib/types";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { Check, Minus, Plus, ShoppingBag, X } from "lucide-react";
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
    // eslint-disable-next-line @next/next/no-img-element -- guest URLs may be any host
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
  const [cartOpen, setCartOpen] = useState(false);

  const itemById = useCallback(
    (id: number) => menu.find((m) => m.menu_id === id),
    [menu],
  );

  const nameOf = (id: number) => itemById(id)?.item_name ?? `#${id}`;

  const total = useMemo(
    () =>
      lines.reduce((sum, ln) => {
        const item = itemById(ln.menuId);
        return sum + (item?.price ?? 0) * ln.quantity;
      }, 0),
    [lines, itemById],
  );

  const totalItems = useMemo(
    () => lines.reduce((sum, ln) => sum + ln.quantity, 0),
    [lines],
  );

  const cartQtyOf = useCallback(
    (menuId: number) => lines.find((l) => l.menuId === menuId)?.quantity ?? 0,
    [lines],
  );

  const quickAdd = useCallback((menuId: number) => {
    setLines((prev) => {
      const i = prev.findIndex((p) => p.menuId === menuId);
      if (i === -1)
        return [...prev, { menuId, quantity: 1, specialRequest: "" }];
      const next = [...prev];
      next[i] = { ...next[i]!, quantity: next[i]!.quantity + 1 };
      return next;
    });
  }, []);

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

  const updateNote = useCallback((index: number, value: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, specialRequest: value };
      return next;
    });
  }, []);

  const handleSubmitOrder = useCallback(() => {
    if (!lines.length) return;
    const fd = new FormData();
    fd.set("qr_token", qrToken);
    fd.set("lines", JSON.stringify(lines));
    startTransition(async () => {
      const result = await createGuestOrderByQrAction(fd);
      if (result.ok) {
        setLines([]);
        setOrderError(null);
        setCartOpen(false);
        setSuccess(true);
        router.refresh();
      } else {
        setOrderError(result.message);
      }
    });
  }, [lines, qrToken, router]);

  if (!available.length) {
    return (
      <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm text-amber-900">
        Menu is not available right now. Please ask a team member.
      </p>
    );
  }

  return (
    <>
      {/* ── Success overlay ── */}
      {success && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-900">
              Order sent!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Your order for{" "}
              <span className="font-semibold">Table&nbsp;{tableNumber}</span>{" "}
              has been sent to the kitchen. Sit back and relax!
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-6 w-full rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-900/20 transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.98]"
            >
              Place another order
            </button>
          </div>
        </div>
      )}

      {/* ── Cart dialog ── */}
      <AlertDialogPrimitive.Root open={cartOpen} onOpenChange={setCartOpen}>
        <AlertDialogPrimitive.Portal>
          <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm outline-none !max-w-md w-full">
            <AlertDialogPrimitive.Title className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900">
              Your Order
              {totalItems > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="mt-1 text-sm text-slate-600">
              Review items, adjust quantities, and send to the kitchen.
            </AlertDialogPrimitive.Description>

            {orderError && (
              <div
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-800"
                role="alert"
              >
                {orderError}
              </div>
            )}

            <div className="mt-5 max-h-[50vh] overflow-y-auto">
              {lines.length > 0 ? (
                <ul className="space-y-3">
                  {lines.map((ln, i) => {
                    const mi = itemById(ln.menuId);
                    const lineTotal = (mi?.price ?? 0) * ln.quantity;
                    return (
                      <li
                        key={i}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            <MenuTileImage src={mi?.image_url ?? null} alt="" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {nameOf(ln.menuId)}
                              </p>
                              <button
                                type="button"
                                onClick={() => removeAt(i)}
                                className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                aria-label={`Remove ${nameOf(ln.menuId)}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(i, -1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-8 text-center text-sm font-bold tabular-nums text-slate-900">
                                  {ln.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(i, 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <span className="text-sm font-bold tabular-nums text-amber-700">
                                THB {lineTotal.toFixed(2)}
                              </span>
                            </div>

                            <input
                              value={ln.specialRequest}
                              onChange={(e) => updateNote(i, e.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                              placeholder="Note (allergies, spice level…)"
                            />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-8 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    Your order is empty
                  </p>
                </div>
              )}
            </div>

            {lines.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-semibold text-slate-700">
                  Total
                </span>
                <span className="text-lg font-bold tabular-nums text-slate-900">
                  THB {total.toFixed(2)}
                </span>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <AlertDialogPrimitive.Cancel className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Add more
              </AlertDialogPrimitive.Cancel>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={!lines.length || pending}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Sending…" : "Send order to kitchen"}
              </button>
            </div>
          </AlertDialogPrimitive.Content>
        </AlertDialogPrimitive.Portal>
      </AlertDialogPrimitive.Root>

      {/* ── Menu grid ── */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 pb-24 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/[0.04] backdrop-blur-sm">
        <div className="p-4 sm:p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Menu
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Tap <span className="font-bold text-amber-600">+</span> to add items
            to your order.
          </p>

          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {available.map((m) => {
              const inCart = cartQtyOf(m.menu_id);
              return (
                <li key={m.menu_id}>
                  <div className="group relative overflow-hidden rounded-2xl border-2 border-slate-200/90 bg-white transition hover:border-amber-200 hover:shadow-md">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <MenuTileImage src={m.image_url} alt={m.item_name} />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 pb-2 pt-8">
                        <p className="line-clamp-2 text-xs font-semibold leading-tight text-white drop-shadow-sm sm:text-sm">
                          {m.item_name}
                        </p>
                      </div>
                      {inCart > 0 && (
                        <div className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white shadow-md">
                          {inCart}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                      <span className="text-sm font-bold tabular-nums text-slate-900">
                        THB {m.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => quickAdd(m.menu_id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm transition hover:bg-amber-400 active:scale-95"
                        aria-label={`Add ${m.item_name} to order`}
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Sticky bottom "View Cart" bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="mx-auto max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl">
          {lines.length > 0 ? (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-800 px-5 py-3.5 text-white shadow-lg shadow-slate-900/25 transition hover:from-slate-800 hover:to-slate-900 active:scale-[0.99]"
            >
              <div className="relative">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-none">
                  {totalItems}
                </span>
              </div>
              <span className="flex-1 text-left text-sm font-bold">
                View Cart
              </span>
              <span className="text-sm font-bold tabular-nums">
                THB {total.toFixed(2)}
              </span>
            </button>
          ) : (
            <p className="py-1 text-center text-sm text-slate-400">
              Tap{" "}
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 align-middle text-white">
                <Plus className="h-3 w-3" />
              </span>{" "}
              to add items
            </p>
          )}
        </div>
      </div>
    </>
  );
};
