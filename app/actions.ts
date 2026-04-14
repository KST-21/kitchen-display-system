"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as k from "@/lib/kitchen-db";
import { broadcastKitchenState } from "@/lib/ws-server";

const ORDER_STATUSES = [
  "Pending",
  "In progress",
  "Completed",
  "Cancelled",
] as const;

const QUEUE_STATUSES = ["Queued", "Preparing", "Ready", "Served"] as const;

const TABLE_STATUSES = [
  "Available",
  "Occupied",
  "Reserved",
  "Cleaning",
] as const;

const revalidateAll = () => {
  revalidatePath("/", "layout");
  revalidatePath("/display/queue");
  revalidatePath("/tables");
  revalidatePath("/order", "layout");
  broadcastKitchenState();
};

const parseOptionalId = (raw: FormDataEntryValue | null): number | null => {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const parsePrice = (raw: FormDataEntryValue | null): number | null => {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/,/g, "");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
};

const parseOrderLines = (
  linesRaw: string,
):
  | {
      ok: true;
      lines: { menuId: number; quantity: number; specialRequest: string }[];
    }
  | { ok: false; message: string } => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(linesRaw);
  } catch {
    return { ok: false, message: "Invalid order payload." };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, message: "Add at least one line item." };
  }
  const lines: { menuId: number; quantity: number; specialRequest: string }[] =
    [];
  for (const entry of parsed) {
    if (entry === null || typeof entry !== "object") {
      return { ok: false, message: "Invalid line item data." };
    }
    const o = entry as Record<string, unknown>;
    const menuId = Number(o.menuId);
    const qty = Math.floor(Number(o.quantity));
    const specialRequest =
      typeof o.specialRequest === "string" ? o.specialRequest : "";
    if (!Number.isFinite(menuId)) {
      return { ok: false, message: "Each line needs a valid menu item." };
    }
    if (!Number.isFinite(qty) || qty < 1) {
      return { ok: false, message: "Each line needs quantity of at least 1." };
    }
    lines.push({ menuId, quantity: qty, specialRequest });
  }
  return { ok: true, lines };
};

export const upsertTableAction = async (formData: FormData) => {
  const id = parseOptionalId(formData.get("table_id"));
  const table_number = String(formData.get("table_number") ?? "").trim();
  const status = String(formData.get("status") ?? "Available").trim();
  if (!table_number) return;
  if (!TABLE_STATUSES.includes(status as (typeof TABLE_STATUSES)[number])) {
    return;
  }
  await k.upsertTable(id, table_number, status);
  revalidateAll();
};

export const deleteTableAction = async (formData: FormData) => {
  const id = Number(formData.get("table_id"));
  if (!Number.isFinite(id)) return;
  if (!k.canDeleteTable(id)) {
    redirect("/tables?error=has_orders");
  }
  await k.deleteTable(id);
  revalidateAll();
};

export const updateTableStatusAction = async (formData: FormData) => {
  const id = Number(formData.get("table_id"));
  const status = String(formData.get("status") ?? "").trim();
  if (!Number.isFinite(id)) return;
  if (!TABLE_STATUSES.includes(status as (typeof TABLE_STATUSES)[number]))
    return;
  await k.updateTableStatus(id, status);
  if (status === "Occupied") {
    await k.regenerateTableQrToken(id);
  }
  revalidateAll();
};

export const regenerateTableQrAction = async (formData: FormData) => {
  const id = Number(formData.get("table_id"));
  if (!Number.isFinite(id)) return;
  await k.regenerateTableQrToken(id);
  revalidateAll();
};

export const upsertChefAction = async (formData: FormData) => {
  const id = parseOptionalId(formData.get("chef_id"));
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) return;
  await k.upsertChef(id, name, phone);
  revalidateAll();
};

export const deleteChefAction = async (formData: FormData) => {
  const id = Number(formData.get("chef_id"));
  if (!Number.isFinite(id)) return;
  await k.deleteChef(id);
  revalidateAll();
};

export const upsertMenuItemAction = async (formData: FormData) => {
  const id = parseOptionalId(formData.get("menu_id"));
  const item_name = String(formData.get("item_name") ?? "").trim();
  const price = parsePrice(formData.get("price"));
  const is_available = formData.get("is_available") === "on";
  const image_url_raw = String(formData.get("image_url") ?? "").trim();
  const image_url = image_url_raw || null;
  if (!item_name || price == null) return;
  await k.upsertMenuItem(id, item_name, price, is_available, image_url);
  revalidateAll();
};

export const deleteMenuItemAction = async (formData: FormData) => {
  const id = Number(formData.get("menu_id"));
  if (!Number.isFinite(id)) return;
  if (!k.canDeleteMenuItem(id)) {
    redirect("/menu?error=in_use");
  }
  await k.deleteMenuItem(id);
  revalidateAll();
};

export const updateOrderStatusAction = async (formData: FormData) => {
  const orderId = Number(formData.get("order_id"));
  const status = String(formData.get("order_status") ?? "");
  if (!Number.isFinite(orderId) || !status) return;
  if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]))
    return;
  await k.updateOrderStatus(orderId, status);
  revalidateAll();
};

export const updateQueueAction = async (formData: FormData) => {
  const queueId = Number(formData.get("queue_id"));
  const chefRaw = formData.get("chef_id");
  const chefId = chefRaw === "" || chefRaw === null ? null : Number(chefRaw);
  const status = String(formData.get("queue_status") ?? "");
  if (!Number.isFinite(queueId) || !status) return;
  if (chefId !== null && !Number.isFinite(chefId)) return;
  if (!QUEUE_STATUSES.includes(status as (typeof QUEUE_STATUSES)[number]))
    return;
  await k.updateQueue(queueId, chefId, status);
  revalidateAll();
};

type CreateOrderResult =
  | { ok: true; orderId: number }
  | { ok: false; message: string };

export const createOrderAction = async (
  formData: FormData,
): Promise<CreateOrderResult> => {
  const tableId = Number(formData.get("table_id"));
  const linesRaw = String(formData.get("lines") ?? "[]");
  if (!Number.isFinite(tableId)) {
    return { ok: false, message: "Choose a valid table." };
  }
  const parsed = parseOrderLines(linesRaw);
  if (!parsed.ok) return { ok: false, message: parsed.message };
  try {
    const orderId = await k.createOrderWithItems(tableId, parsed.lines);
    revalidateAll();
    return { ok: true, orderId };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not create the order.";
    return { ok: false, message };
  }
};

/** Self-order from guest phone: validates QR token server-side. */
export const createGuestOrderByQrAction = async (
  formData: FormData,
): Promise<CreateOrderResult> => {
  const token = String(formData.get("qr_token") ?? "").trim();
  const linesRaw = String(formData.get("lines") ?? "[]");
  const table = await k.getTableByQrToken(token);
  if (!table) {
    return {
      ok: false,
      message:
        "This table link is invalid or was reset. Ask staff for a new QR code.",
    };
  }
  const parsed = parseOrderLines(linesRaw);
  if (!parsed.ok) return { ok: false, message: parsed.message };
  try {
    const orderId = await k.createOrderWithItems(table.table_id, parsed.lines);
    revalidateAll();
    revalidatePath(`/order/${token}`);
    return { ok: true, orderId };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not create the order.";
    return { ok: false, message };
  }
};

export const advanceQueueStatusAction = async (formData: FormData) => {
  const queueId = Number(formData.get("queue_id"));
  if (!Number.isFinite(queueId)) return;
  await k.advanceQueueStatus(queueId);
  revalidateAll();
};
