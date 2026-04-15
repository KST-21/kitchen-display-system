import { QueueStatus } from "@prisma/client";
import { QueueRow } from "./types";

/** Light, high-contrast column styling for kitchen displays. */
export const DISPLAY_COLUMNS: {
  status: QueueStatus;
  title: string;
  headerClass: string;
  cardClass: string;
  actionBtnClass: string;
}[] = [
  {
    status: "Queued",
    title: "Queue",
    headerClass:
      "bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100/80 text-amber-950 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.6)]",
    cardClass:
      "border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-white to-amber-50/40 shadow-sm",
    actionBtnClass:
      "bg-gradient-to-b from-amber-700 to-amber-800 text-white shadow-md shadow-amber-900/25 hover:from-amber-600 hover:to-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-[0.98]",
  },
  {
    status: "Preparing",
    title: "Preparing",
    headerClass:
      "bg-gradient-to-br from-sky-100 via-sky-50 to-sky-100/80 text-sky-950 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.6)]",
    cardClass:
      "border-sky-200/90 bg-gradient-to-br from-sky-50/95 via-white to-sky-50/40 shadow-sm",
    actionBtnClass:
      "bg-gradient-to-b from-sky-600 to-sky-700 text-white shadow-md shadow-sky-900/20 hover:from-sky-500 hover:to-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 active:scale-[0.98]",
  },
  {
    status: "Ready",
    title: "Ready",
    headerClass:
      "bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100/80 text-emerald-950 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.6)]",
    cardClass:
      "border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 via-white to-emerald-50/40 shadow-sm",
    /** Solid dark bar + forced white label (hex so it never “washes out” on light emerald cards). */
    actionBtnClass:
      "border border-black/10 !bg-[#0f172a] !text-white shadow-md hover:!bg-[#1e293b] active:!bg-[#020617] [&_span]:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 active:scale-[0.98]",
  },
  {
    status: "Served",
    title: "Served",
    headerClass:
      "bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200/90 text-slate-800 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7)]",
    cardClass:
      "border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 shadow-sm",
    actionBtnClass: "",
  },
];

export const groupQueueRowsByStatus = (
  rows: QueueRow[],
): Map<string, QueueRow[]> => {
  const map = new Map<string, QueueRow[]>();
  for (const col of DISPLAY_COLUMNS) {
    map.set(col.status, []);
  }
  for (const r of rows) {
    const bucket = map.get(r.Status);
    if (bucket) {
      bucket.push(r);
    } else {
      map.get("Queued")!.push(r);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.queueNumber - b.queueNumber);
  }
  return map;
};
