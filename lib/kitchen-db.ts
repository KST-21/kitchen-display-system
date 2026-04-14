import { prisma } from "@/lib/prisma";
import {
  MenuItemWithDelete,
  OrderLine,
  OrderRow,
  QueueRow,
  RestaurantTableWithDelete,
} from "@/lib/types";
import { sort } from "./utils/sort";

export const newQrToken = () => crypto.randomUUID();

export const dashboardCounts = async () => {
  const [tables, chefs, menu, orders, queue] = await Promise.all([
    prisma.table.count(),
    prisma.chef.count(),
    prisma.menu_Item.count(),
    prisma.order.count(),
    prisma.kitchenQueue.count(),
  ]);

  return {
    tables: { c: tables },
    chefs: { c: chefs },
    menu: { c: menu },
    orders: { c: orders },
    queue: { c: queue },
  };
};

export const listTables = async () => {
  const tables = await prisma.table.findMany();

  return sort(tables, "table_number", "asc", {
    table_number: (t) => {
      const n = Number(t.table_number);
      return isNaN(n) ? t.table_number : n;
    },
  });
};

export const tableStatusCounts = async (): Promise<Record<string, number>> => {
  const result = await prisma.table.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const map: Record<string, number> = {};
  for (const r of result) {
    map[r.status] = r._count.status;
  }

  return map;
};

export const canDeleteTable = async (tableId: number): Promise<boolean> => {
  const count = await prisma.order.count({
    where: { table_id: tableId },
  });

  return count === 0;
};

export const listTablesWithDeleteFlag = async (): Promise<
  RestaurantTableWithDelete[]
> => {
  const tables = await listTables();

  return await Promise.all(
    tables.map(async (t) => ({
      ...t,
      can_delete: await canDeleteTable(t.table_id),
    })),
  );
};

export const getTableByQrToken = async (token: string) => {
  return await prisma.table.findUnique({
    where: { qr_token: token.trim() },
  });
};

export const upsertTable = async (
  id: number | null,
  table_number: string,
  status: string,
) => {
  if (!table_number.trim()) {
    throw new Error("Table number is required");
  }

  if (id == null) {
    await prisma.table.create({
      data: {
        table_number,
        status,
        qr_token: crypto.randomUUID(),
      },
    });
  } else {
    await prisma.table.update({
      where: { table_id: id },
      data: {
        table_number,
        status,
      },
    });
  }
};

export const updateTableStatus = async (tableId: number, status: string) => {
  await prisma.table.update({
    where: { table_id: tableId },
    data: { status },
  });
};

export const regenerateTableQrToken = async (
  tableId: number,
): Promise<string> => {
  const token = newQrToken();

  await prisma.table.update({
    where: { table_id: tableId },
    data: { qr_token: token },
  });

  return token;
};

export const deleteTable = async (id: number) => {
  await prisma.table.delete({
    where: { table_id: id },
  });
};

export const listChefs = async () => {
  return await prisma.chef.findMany({
    orderBy: { chef_id: "asc" },
  });
};

export const upsertChef = async (
  id: number | null,
  name: string,
  phone: string,
) => {
  if (id == null) {
    await prisma.chef.create({
      data: { name, phone },
    });
  } else {
    await prisma.chef.update({
      where: { chef_id: id },
      data: { name, phone },
    });
  }
};

export const deleteChef = async (id: number) => {
  await prisma.kitchenQueue.updateMany({
    where: { chef_id: id },
    data: { chef_id: null },
  });

  await prisma.chef.delete({
    where: { chef_id: id },
  });
};

export const listMenuItems = async () => {
  return await prisma.menu_Item.findMany({
    orderBy: { menu_id: "asc" },
  });
};

export const canDeleteMenuItem = async (menuId: number): Promise<boolean> => {
  const count = await prisma.order_Item.count({
    where: { menu_id: menuId },
  });

  return count === 0;
};

export const listMenuItemsWithDeleteFlag = async (): Promise<
  MenuItemWithDelete[]
> => {
  const items = await prisma.menu_Item.findMany({
    orderBy: { menu_id: "asc" },
    include: {
      order_items: true,
    },
  });

  return items.map((m) => ({
    ...m,
    can_delete: m.order_items.length === 0,
  }));
};

export const upsertMenuItem = async (
  id: number | null,
  item_name: string,
  price: number,
  is_available: boolean,
  image_url: string | null,
) => {
  if (id == null) {
    await prisma.menu_Item.create({
      data: {
        item_name,
        price,
        is_available,
        image_url: image_url?.trim() || null,
      },
    });
  } else {
    await prisma.menu_Item.update({
      where: { menu_id: id },
      data: {
        item_name,
        price,
        is_available,
        image_url: image_url?.trim() || null,
      },
    });
  }
};

export const deleteMenuItem = async (id: number) => {
  await prisma.menu_Item.delete({
    where: { menu_id: id },
  });
};

const nextQueuePosition = async (): Promise<number> => {
  const result = await prisma.kitchenQueue.aggregate({
    _max: { position: true },
  });

  return (result._max.position ?? 0) + 1;
};

export const createOrderWithItems = async (
  tableId: number,
  lineItems: { menuId: number; quantity: number; specialRequest: string }[],
  orderStatus = "Pending",
): Promise<number> => {
  if (!lineItems.length) {
    throw new Error("Order must include at least one line item");
  }

  const table = await prisma.table.findUnique({
    where: { table_id: tableId },
  });
  if (!table) throw new Error("Table not found");

  for (const li of lineItems) {
    if (!Number.isInteger(li.quantity) || li.quantity < 1) {
      throw new Error("Invalid quantity");
    }

    const menu = await prisma.menu_Item.findUnique({
      where: { menu_id: li.menuId },
    });

    if (!menu) throw new Error("Unknown menu item");
    if (!menu.is_available) {
      throw new Error("Item unavailable");
    }
  }

  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        table_id: tableId,
        order_status: orderStatus,
      },
    });

    await tx.order.update({
      where: { order_id: order.order_id },
      data: { order_number: order.order_id },
    });

    for (const li of lineItems) {
      await tx.order_Item.create({
        data: {
          order_id: order.order_id,
          menu_id: li.menuId,
          quantity: li.quantity,
          special_request: li.specialRequest.trim() || null,
        },
      });
    }

    const position = await nextQueuePosition();

    await tx.kitchenQueue.create({
      data: {
        order_id: order.order_id,
        position,
        status: "Queued",
        priority: 0,
      },
    });

    return order.order_id;
  });
};

export const listOrders = async (): Promise<OrderRow[]> => {
  const orders = await prisma.order.findMany({
    include: {
      table: true,
    },
    orderBy: { order_id: "desc" },
  });

  return orders.map((o) => ({
    order_id: o.order_id,
    table_id: o.table_id,
    table_number: o.table.table_number,
    created_at: o.created_at.toISOString(),
    order_status: o.order_status,
    order_number: o.order_number,
  }));
};

export const getOrderItems = async (orderId: number): Promise<OrderLine[]> => {
  const items = await prisma.order_Item.findMany({
    where: { order_id: orderId },
    include: {
      menu: true,
    },
    orderBy: { order_item_id: "asc" },
  });

  return items.map((i) => ({
    order_item_id: i.order_item_id,
    menu_id: i.menu_id,
    item_name: i.menu.item_name,
    quantity: i.quantity,
    special_request: i.special_request,
    price: i.menu.price,
  }));
};

export const mapOrderIdToLines = async (): Promise<
  Map<number, OrderLine[]>
> => {
  const items = await prisma.order_Item.findMany({
    include: { menu: true },
    orderBy: [{ order_id: "desc" }, { order_item_id: "asc" }],
  });

  const map = new Map<number, OrderLine[]>();

  for (const i of items) {
    const line: OrderLine = {
      order_item_id: i.order_item_id,
      menu_id: i.menu_id,
      item_name: i.menu.item_name,
      quantity: i.quantity,
      special_request: i.special_request,
      price: i.menu.price,
    };

    const list = map.get(i.order_id) ?? [];
    list.push(line);
    map.set(i.order_id, list);
  }

  return map;
};

export const updateOrderStatus = async (orderId: number, status: string) => {
  await prisma.order.update({
    where: { order_id: orderId },
    data: { order_status: status },
  });
};

export const listKitchenQueue = async (): Promise<QueueRow[]> => {
  const rows = await prisma.kitchenQueue.findMany({
    include: {
      chef: true,
      order: {
        include: {
          table: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { position: "asc" }, { queue_id: "asc" }],
  });

  return rows.map((k) => ({
    queue_id: k.queue_id,
    order_id: k.order_id,
    chef_id: k.chef_id,
    chef_name: k.chef?.name ?? null,
    queueNumber: k.position,
    created_at: k.created_at.toISOString(),
    Status: k.status,
    table_number: k.order.table.table_number,
    order_status: k.order.order_status,
  }));
};

export const updateQueue = async (
  queueId: number,
  chefId: number | null,
  status: string,
) => {
  await prisma.kitchenQueue.update({
    where: { queue_id: queueId },
    data: {
      chef_id: chefId,
      status,
    },
  });

  if (status === "Served") {
    const queue = await prisma.kitchenQueue.findUnique({
      where: { queue_id: queueId },
      include: {
        order: true,
      },
    });

    if (queue?.order?.table_id) {
      await regenerateTableQrToken(queue.order.table_id);
    }
  }
};

/** Advance queue status to the next column: Queued→Preparing→Ready→Served */
export const advanceQueueStatus = async (
  queueId: number,
  chefId?: number | null,
) => {
  const row = await prisma.kitchenQueue.findUnique({
    where: { queue_id: queueId },
  });

  if (!row) return;

  const order = ["Queued", "Preparing", "Ready", "Served"];
  const idx = order.indexOf(row.status);
  if (idx < 0 || idx >= order.length - 1) return;

  const next = order[idx + 1];
  const assignedChef = chefId !== undefined ? chefId : row.chef_id;

  await updateQueue(queueId, assignedChef, next);
};

/** Remove a served queue entry (marks order Completed too). */
export const removeServedQueueEntry = async (queueId: number) => {
  const row = await prisma.kitchenQueue.findUnique({
    where: { queue_id: queueId },
  });

  if (!row || row.status !== "Served") return;

  await prisma.$transaction([
    prisma.order.update({
      where: { order_id: row.order_id },
      data: { order_status: "Completed" },
    }),
    prisma.kitchenQueue.delete({
      where: { queue_id: queueId },
    }),
  ]);
};

export const clearAllData = async () => {
  await prisma.$transaction([
    prisma.kitchenQueue.deleteMany(),
    prisma.order_Item.deleteMany(),
    prisma.order.deleteMany(),
    prisma.table.deleteMany(),
    prisma.menu_Item.deleteMany(),
    prisma.chef.deleteMany(),
  ]);
};
