import { QueueStatus } from "@prisma/client";
import { QueueRow } from "./types";

export const DISPLAY_COLUMNS: {
  status: QueueStatus;
  title: string;
  headerClass: string;
  cardClass: string;
}[] = [
  {
    status: "Queued",
    title: "Queue",
    headerClass: "bg-slate-100 text-slate-900 border border-slate-200",
    cardClass: "border-slate-200 bg-white shadow-sm",
  },
  {
    status: "Preparing",
    title: "Preparing",
    headerClass: "bg-slate-100 text-slate-900 border border-slate-200",
    cardClass: "border-slate-200 bg-white shadow-sm",
  },
  {
    status: "Ready",
    title: "Ready",
    headerClass: "bg-slate-100 text-slate-900 border border-slate-200",
    cardClass: "border-slate-200 bg-white shadow-sm",
  },
  {
    status: "Served",
    title: "Served",
    headerClass: "bg-slate-100 text-slate-900 border border-slate-200",
    cardClass: "border-slate-200 bg-white shadow-sm",
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
