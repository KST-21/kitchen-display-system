"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DISPLAY_COLUMNS, groupQueueRowsByStatus } from "@/lib/queue-display";
import { Chef, QueueRow } from "@/lib/types";
import { getNextQueueStatus } from "@/lib/constants/queue";

const requestElementFullscreen = (el: HTMLElement): Promise<void> => {
  const w = el as HTMLElement & { webkitRequestFullscreen?: () => void };
  if (typeof el.requestFullscreen === "function") return el.requestFullscreen();
  if (typeof w.webkitRequestFullscreen === "function") {
    w.webkitRequestFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error("Fullscreen not supported"));
};

const exitDocumentFullscreen = (): Promise<void> => {
  const d = document as Document & { webkitExitFullscreen?: () => void };
  if (typeof document.exitFullscreen === "function")
    return document.exitFullscreen();
  if (typeof d.webkitExitFullscreen === "function") {
    d.webkitExitFullscreen();
    return Promise.resolve();
  }
  return Promise.reject(new Error("Fullscreen not supported"));
};

const BtnSpinner = ({ light }: { light?: boolean }) => {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-t-transparent ${
        light
          ? "border-white/35 border-t-white"
          : "border-red-300 border-t-red-600"
      }`}
      aria-hidden
    />
  );
};

const TicketCard = ({
  r,
  cardClass,
  actionBtnClass,
  chefPassView,
  isBusy,
  animDelayMs,
  onAdvance,
  onRemove,
}: {
  r: QueueRow;
  cardClass: string;
  actionBtnClass: string;
  chefPassView?: boolean;
  isBusy?: boolean;
  animDelayMs?: number;
  onAdvance: () => void;
  onRemove?: () => void;
}) => {
  const next = getNextQueueStatus(r.Status);
  const isServed = r.Status === "Served";
  const big = Boolean(chefPassView);
  return (
    <li
      style={
        animDelayMs != null ? { animationDelay: `${animDelayMs}ms` } : undefined
      }
      className={`group relative animate-queue-card-in rounded-xl border transition duration-200 hover:z-[1] hover:-translate-y-0.5 hover:shadow-lg ${
        isBusy ? "pointer-events-none opacity-75" : ""
      } ${big ? "px-4 py-3.5" : "px-3 py-2.5"} ${cardClass}`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="relative flex items-baseline justify-between gap-2">
        <span
          className={`font-bold tabular-nums leading-none tracking-tight text-slate-900 ${
            big ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {r.queueNumber}
        </span>
        <span
          className={`rounded-md bg-white/60 px-1.5 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-900/5 backdrop-blur-sm ${
            big ? "text-sm" : "text-xs"
          }`}
        >
          T{r.table_number}
        </span>
      </div>
      <p
        className={`relative mt-1 text-slate-600 ${big ? "text-sm" : "text-xs"}`}
      >
        #{r.order_id}
        {r.chef_name ? <> · {r.chef_name}</> : null}
      </p>
      {next ? (
        <button
          type="button"
          disabled={isBusy}
          onClick={onAdvance}
          className={`relative z-[1] mt-2 flex w-full appearance-none items-center justify-center gap-2 rounded-lg font-semibold transition duration-150 [text-shadow:0_1px_0_rgb(0_0_0_/_0.2)] disabled:cursor-wait disabled:opacity-90 ${
            big
              ? "min-h-[2.75rem] py-2.5 text-sm"
              : "min-h-[2.25rem] py-2 text-[11px]"
          } ${actionBtnClass || "bg-slate-800 text-white hover:bg-slate-700 [&_span]:text-white"}`}
        >
          {isBusy ? (
            <>
              <BtnSpinner light />
              <span>Updating…</span>
            </>
          ) : (
            <>
              <span
                className="transition group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </span>
              {next}
            </>
          )}
        </button>
      ) : null}
      {isServed && onRemove ? (
        <button
          type="button"
          disabled={isBusy}
          onClick={onRemove}
          className={`relative mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200/90 bg-gradient-to-b from-red-50 to-red-100/80 font-semibold text-red-800 shadow-sm transition duration-150 hover:border-red-300 hover:from-red-100 hover:to-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 active:scale-[0.98] disabled:cursor-wait ${
            big
              ? "min-h-[2.75rem] py-2.5 text-sm"
              : "min-h-[2.25rem] py-2 text-[11px]"
          }`}
        >
          {isBusy ? (
            <>
              <BtnSpinner />
              <span>Clearing…</span>
            </>
          ) : (
            "Clear"
          )}
        </button>
      ) : null}
    </li>
  );
};

type ModalState = {
  queueId: number;
  queueNumber: number;
  tableName: string;
  currentChef: number | null;
} | null;

const ChefModal = ({
  modal,
  chefs,
  onConfirm,
  onCancel,
}: {
  modal: NonNullable<ModalState>;
  chefs: Chef[];
  onConfirm: (queueId: number, chefId: number | null) => void;
  onCancel: () => void;
}) => {
  const [selectedChef, setSelectedChef] = useState<string>(
    modal.currentChef != null ? String(modal.currentChef) : "",
  );

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-900/45 px-4 backdrop-blur-[2px]"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="animate-modal-in w-full max-w-md rounded-2xl border border-white/30 bg-white p-6 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chef-modal-title"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-lg font-bold text-white shadow-md shadow-amber-900/25">
            {modal.queueNumber}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="chef-modal-title"
              className="text-lg font-bold tracking-tight text-slate-900"
            >
              Start preparing
            </h3>
            <p className="mt-0.5 text-sm text-slate-600">
              Ticket{" "}
              <span className="font-semibold text-slate-800">
                #{modal.queueNumber}
              </span>
              {" · "}
              Table{" "}
              <span className="font-semibold text-slate-800">
                {modal.tableName}
              </span>
            </p>
          </div>
        </div>

        <label className="mt-6 flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assign chef
          <select
            value={selectedChef}
            onChange={(e) => setSelectedChef(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-medium text-slate-900 shadow-inner transition hover:border-sky-300 hover:bg-white focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
            autoFocus
          >
            <option value="">Unassigned</option>
            {chefs.map((c) => (
              <option key={c.chef_id} value={c.chef_id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const chefId = selectedChef ? Number(selectedChef) : null;
              onConfirm(modal.queueId, chefId);
            }}
            className="rounded-xl bg-gradient-to-b from-sky-600 to-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/25 transition hover:from-sky-500 hover:to-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-[0.99]"
          >
            Confirm → Preparing
          </button>
        </div>
      </div>
    </div>
  );
};

const useKitchenWebSocket = (
  wsPort: number,
  onMessage: (rows: QueueRow[], chefs: Chef[]) => void,
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let dead = false;

    const connect = () => {
      if (dead) return;
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const host = window.location.hostname;
      const url = `${proto}://${host}:${wsPort}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === "state" && Array.isArray(data.rows)) {
            onMessage(data.rows, data.chefs ?? []);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        if (!dead) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      dead = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [wsPort, onMessage]);
};

const apiPost = async (url: string, body: Record<string, unknown>) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { rows: QueueRow[]; chefs: Chef[] };
};

export const QueueDisplayBoard = ({
  initialRows,
  initialChefs,
  wsPort = 3001,
  pollIntervalSeconds = 10,
}: {
  initialRows: QueueRow[];
  initialChefs: Chef[];
  wsPort?: number;
  pollIntervalSeconds?: number;
}) => {
  const [rows, setRows] = useState<QueueRow[]>(initialRows);
  const [chefs, setChefs] = useState<Chef[]>(initialChefs);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [pendingQueueId, setPendingQueueId] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      const el = rootRef.current;
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const fsEl =
        document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setIsFullscreen(el != null && fsEl === el);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener(
        "webkitfullscreenchange",
        sync as EventListener,
      );
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
    };
    const fsEl =
      document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
    try {
      if (fsEl === el) {
        await exitDocumentFullscreen();
      } else {
        await requestElementFullscreen(el);
      }
      if (mounted.current) setFullscreenError(null);
    } catch {
      if (mounted.current) {
        setFullscreenError(
          "Fullscreen is not available in this browser or was blocked.",
        );
      }
    }
  }, []);

  const applyData = useCallback((data: { rows: QueueRow[]; chefs: Chef[] }) => {
    if (!mounted.current) return;
    setRows(data.rows);
    setChefs(data.chefs);
    setFetchError(null);
  }, []);

  const handleWsMessage = useCallback(
    (newRows: QueueRow[], newChefs: Chef[]) => {
      if (!mounted.current) return;
      setRows(newRows);
      setChefs(newChefs);
      setFetchError(null);
      setWsConnected(true);
    },
    [],
  );

  useKitchenWebSocket(wsPort, handleWsMessage);

  const pull = useCallback(async () => {
    try {
      const res = await fetch("/api/display/kitchen-queue", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      applyData(await res.json());
    } catch {
      if (mounted.current) setFetchError("Could not refresh queue");
    }
  }, [applyData]);

  useEffect(() => {
    const id = setInterval(pull, pollIntervalSeconds * 1000);
    return () => clearInterval(id);
  }, [pull, pollIntervalSeconds]);

  /** Queued→Preparing: open chef modal. Other transitions: instant advance. */
  const handleAdvance = useCallback(
    (r: QueueRow) => {
      if (r.Status === "Queued") {
        setModal({
          queueId: r.queue_id,
          queueNumber: r.queueNumber,
          tableName: r.table_number,
          currentChef: r.chef_id,
        });
      } else {
        const qid = r.queue_id;
        setPendingQueueId(qid);
        apiPost("/api/display/kitchen-queue/advance", { queue_id: qid })
          .then(applyData)
          .catch(() => {
            if (mounted.current) setFetchError("Could not update status");
          })
          .finally(() => {
            if (mounted.current) setPendingQueueId(null);
          });
      }
    },
    [applyData],
  );

  const confirmChefAndAdvance = useCallback(
    async (queueId: number, chefId: number | null) => {
      setModal(null);
      setPendingQueueId(queueId);
      try {
        applyData(
          await apiPost("/api/display/kitchen-queue/advance", {
            queue_id: queueId,
            chef_id: chefId,
          }),
        );
      } catch {
        if (mounted.current) setFetchError("Could not update status");
      } finally {
        if (mounted.current) setPendingQueueId(null);
      }
    },
    [applyData],
  );

  const handleRemove = useCallback(
    async (queueId: number) => {
      setPendingQueueId(queueId);
      try {
        applyData(
          await apiPost("/api/display/kitchen-queue/remove", {
            queue_id: queueId,
          }),
        );
      } catch {
        if (mounted.current) setFetchError("Could not remove ticket");
      } finally {
        if (mounted.current) setPendingQueueId(null);
      }
    },
    [applyData],
  );

  const byStatus = groupQueueRowsByStatus(rows);

  return (
    <div
      ref={rootRef}
      className={`mx-auto max-w-[1920px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 ${
        isFullscreen
          ? "min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/90"
          : ""
      }`}
    >
      <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-800/90">
            Pass display · chef station
          </p>
          <h1 className="mt-1 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl lg:text-4xl">
            Kitchen queue display
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Tap a ticket to move it forward. Live updates when connected.
          </p>
          {fetchError ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                aria-hidden
              />
              {fetchError}
            </p>
          ) : null}
          {fullscreenError ? (
            <p className="mt-2 text-xs font-medium text-red-700">
              {fullscreenError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto sm:gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
              wsConnected
                ? "border-emerald-200/80 bg-emerald-50/90 text-emerald-900"
                : "border-slate-200 bg-white text-slate-600"
            }`}
            title={
              wsConnected ? "Live (WebSocket)" : "Polling every few seconds"
            }
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {wsConnected ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              ) : null}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  wsConnected ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
            </span>
            {wsConnected ? "Live" : "Polling"}
          </div>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold shadow-md transition active:scale-[0.98] ${
              isFullscreen
                ? "border border-slate-600 bg-slate-800 text-white hover:bg-slate-700"
                : "border border-amber-500/20 bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-amber-900/20 hover:from-amber-400 hover:to-amber-500"
            }`}
            title={
              isFullscreen
                ? "Leave full screen (Esc)"
                : "Fill the screen for the pass monitor"
            }
          >
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="mx-auto mt-12 max-w-md animate-queue-card-in rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-8 py-12 text-center shadow-inner backdrop-blur-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-2xl shadow-inner">
            ✓
          </div>
          <p className="mt-4 text-base font-semibold text-slate-800">
            All clear
          </p>
          <p className="mt-1 text-sm text-slate-500">
            No tickets on the pass right now.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3 xl:gap-4">
          {DISPLAY_COLUMNS.map((col) => {
            const items = byStatus.get(col.status) ?? [];
            return (
              <section
                key={col.status}
                className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-md shadow-slate-900/[0.04] ring-1 ring-slate-900/[0.03] backdrop-blur-sm transition-shadow hover:shadow-lg ${
                  isFullscreen
                    ? "min-h-[min(72vh,560px)]"
                    : "min-h-[min(60vh,400px)]"
                }`}
              >
                <div
                  className={`px-3 py-2.5 text-center font-bold uppercase tracking-[0.12em] ${
                    isFullscreen ? "py-3 text-sm tracking-[0.14em]" : "text-xs"
                  } ${col.headerClass}`}
                >
                  {col.title}
                  <span className="ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-white/50 px-1.5 tabular-nums text-[0.85em] font-bold text-slate-800 ring-1 ring-slate-900/5">
                    {items.length}
                  </span>
                </div>
                <ul className="flex flex-1 flex-col gap-2.5 overflow-y-auto scroll-smooth bg-slate-50/40 p-2.5 sm:p-3">
                  {items.length === 0 ? (
                    <li className="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center">
                      <span className="text-2xl opacity-40" aria-hidden>
                        ···
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        Nothing here
                      </span>
                    </li>
                  ) : (
                    items.map((r, idx) => (
                      <TicketCard
                        key={r.queue_id}
                        r={r}
                        cardClass={col.cardClass}
                        actionBtnClass={col.actionBtnClass}
                        chefPassView={isFullscreen}
                        isBusy={pendingQueueId === r.queue_id}
                        animDelayMs={Math.min(idx, 10) * 42}
                        onAdvance={() => handleAdvance(r)}
                        onRemove={
                          r.Status === "Served"
                            ? () => void handleRemove(r.queue_id)
                            : undefined
                        }
                      />
                    ))
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {modal ? (
        <ChefModal
          key={modal.queueId}
          modal={modal}
          chefs={chefs}
          onConfirm={confirmChefAndAdvance}
          onCancel={() => setModal(null)}
        />
      ) : null}
    </div>
  );
};
