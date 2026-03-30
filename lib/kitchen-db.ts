/**
 * Kitchen Management — SQLite (ERD: Table, Order, Menu_Item, Order_Item, KitchenQueue, Chef).
 * Server-only (better-sqlite3).
 */

import Database from "better-sqlite3";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const DB_DIR =
  process.env.KITCHEN_DATA_DIR?.trim() ||
  path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "kitchen.db");

const globalForDb = globalThis as unknown as { __kitchenDb?: Database.Database };

export function newQrToken(): string {
  return randomBytes(24).toString("base64url");
}

function createFreshSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "Table" (
      table_id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'Available',
      qr_token TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS Chef (
      chef_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS Menu_Item (
      menu_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      is_available INTEGER NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1)),
      image_url TEXT
    );
    CREATE TABLE IF NOT EXISTS "Order" (
      order_id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      order_status TEXT NOT NULL DEFAULT 'Pending',
      order_number INTEGER,
      FOREIGN KEY (table_id) REFERENCES "Table"(table_id)
    );
    CREATE TABLE IF NOT EXISTS Order_Item (
      order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      special_request TEXT,
      FOREIGN KEY (order_id) REFERENCES "Order"(order_id) ON DELETE CASCADE,
      FOREIGN KEY (menu_id) REFERENCES Menu_Item(menu_id)
    );
    CREATE TABLE IF NOT EXISTS KitchenQueue (
      queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      chef_id INTEGER,
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Queued',
      priority INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES "Order"(order_id) ON DELETE CASCADE,
      FOREIGN KEY (chef_id) REFERENCES Chef(chef_id)
    );
    CREATE INDEX IF NOT EXISTS idx_order_table ON "Order"(table_id);
    CREATE INDEX IF NOT EXISTS idx_order_item_order ON Order_Item(order_id);
    CREATE INDEX IF NOT EXISTS idx_kitchen_queue_chef ON KitchenQueue(chef_id);
  `);
}

function openDb(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");

  const legacyCustomer = db
    .prepare(
      `SELECT 1 FROM sqlite_master WHERE type='table' AND name='Customer'`
    )
    .get();
  if (legacyCustomer) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      DROP TABLE IF EXISTS KitchenQueue;
      DROP TABLE IF EXISTS Order_Item;
      DROP TABLE IF EXISTS "Order";
      DROP TABLE IF EXISTS Customer;
      DROP TABLE IF EXISTS Menu_Item;
      DROP TABLE IF EXISTS Chef;
      DROP TABLE IF EXISTS "Table";
      PRAGMA foreign_keys = ON;
    `);
  }

  createFreshSchema(db);
  migrateMenuItemImageUrl(db);
  return db;
}

function migrateMenuItemImageUrl(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(Menu_Item)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "image_url")) {
    db.exec("ALTER TABLE Menu_Item ADD COLUMN image_url TEXT");
  }
}

export function getDb(): Database.Database {
  if (!globalForDb.__kitchenDb) {
    globalForDb.__kitchenDb = openDb();
    seedDemoData();
  }
  return globalForDb.__kitchenDb;
}

function nowIso(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

export type RestaurantTable = {
  table_id: number;
  table_number: string;
  status: string;
  qr_token: string;
};

export type Chef = { chef_id: number; name: string; phone: string };
export type MenuItem = {
  menu_id: number;
  item_name: string;
  price: number;
  is_available: number;
  /** Optional photo URL (https) or site path (e.g. /menu/item.jpg). */
  image_url: string | null;
};
export type OrderRow = {
  order_id: number;
  table_id: number;
  table_number: string;
  created_at: string;
  order_status: string;
  order_number: number | null;
};
export type OrderLine = {
  order_item_id: number;
  menu_id: number;
  item_name: string;
  quantity: number;
  special_request: string | null;
  price: number;
};
export type QueueRow = {
  queue_id: number;
  order_id: number;
  chef_id: number | null;
  chef_name: string | null;
  queueNumber: number;
  created_at: string;
  Status: string;
  table_number: string;
  order_status: string;
};

export function dashboardCounts() {
  const db = getDb();
  return {
    tables: db.prepare('SELECT COUNT(*) AS c FROM "Table"').get() as { c: number },
    chefs: db.prepare("SELECT COUNT(*) AS c FROM Chef").get() as { c: number },
    menu: db.prepare("SELECT COUNT(*) AS c FROM Menu_Item").get() as { c: number },
    orders: db.prepare('SELECT COUNT(*) AS c FROM "Order"').get() as { c: number },
    queue: db.prepare("SELECT COUNT(*) AS c FROM KitchenQueue").get() as { c: number },
  };
}

export function listTables(): RestaurantTable[] {
  return getDb()
    .prepare('SELECT * FROM "Table" ORDER BY table_id')
    .all() as RestaurantTable[];
}

export function tableStatusCounts(): Record<string, number> {
  const rows = getDb()
    .prepare('SELECT status, COUNT(*) AS c FROM "Table" GROUP BY status')
    .all() as { status: string; c: number }[];
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.c;
  return map;
}

export type RestaurantTableWithDelete = RestaurantTable & { can_delete: boolean };

export function canDeleteTable(tableId: number): boolean {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS c FROM "Order" WHERE table_id = ?')
    .get(tableId) as { c: number };
  return row.c === 0;
}

export function listTablesWithDeleteFlag(): RestaurantTableWithDelete[] {
  return listTables().map((t) => ({
    ...t,
    can_delete: canDeleteTable(t.table_id),
  }));
}

export function getTableByQrToken(token: string): RestaurantTable | null {
  const row = getDb()
    .prepare('SELECT * FROM "Table" WHERE qr_token = ?')
    .get(token.trim()) as RestaurantTable | undefined;
  return row ?? null;
}

export function upsertTable(
  id: number | null,
  table_number: string,
  status: string
) {
  const db = getDb();
  const num = table_number.trim();
  if (!num) throw new Error("Table number is required");
  if (id == null) {
    db.prepare(
      'INSERT INTO "Table" (table_number, status, qr_token) VALUES (?, ?, ?)'
    ).run(num, status || "Available", newQrToken());
  } else {
    db.prepare(
      'UPDATE "Table" SET table_number = ?, status = ? WHERE table_id = ?'
    ).run(num, status || "Available", id);
  }
}

export function regenerateTableQrToken(tableId: number) {
  const db = getDb();
  const tok = newQrToken();
  db.prepare('UPDATE "Table" SET qr_token = ? WHERE table_id = ?').run(
    tok,
    tableId
  );
  return tok;
}

export function deleteTable(id: number) {
  getDb().prepare('DELETE FROM "Table" WHERE table_id = ?').run(id);
}

export function listChefs(): Chef[] {
  return getDb().prepare("SELECT * FROM Chef ORDER BY chef_id").all() as Chef[];
}

export function upsertChef(id: number | null, name: string, phone: string) {
  const db = getDb();
  if (id == null) {
    db.prepare("INSERT INTO Chef (name, phone) VALUES (?, ?)").run(name, phone);
  } else {
    db.prepare("UPDATE Chef SET name = ?, phone = ? WHERE chef_id = ?").run(name, phone, id);
  }
}

export function deleteChef(id: number) {
  const db = getDb();
  db.prepare("UPDATE KitchenQueue SET chef_id = NULL WHERE chef_id = ?").run(id);
  db.prepare("DELETE FROM Chef WHERE chef_id = ?").run(id);
}

export function listMenuItems(): MenuItem[] {
  const raw = getDb()
    .prepare("SELECT * FROM Menu_Item ORDER BY menu_id")
    .all() as (Omit<MenuItem, "image_url"> & { image_url?: string | null })[];
  return raw.map((r) => ({
    ...r,
    image_url:
      r.image_url != null && String(r.image_url).trim() !== ""
        ? String(r.image_url).trim()
        : null,
  }));
}

export type MenuItemWithDelete = MenuItem & { can_delete: boolean };

export function canDeleteMenuItem(menuId: number): boolean {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS c FROM Order_Item WHERE menu_id = ?")
    .get(menuId) as { c: number };
  return row.c === 0;
}

export function listMenuItemsWithDeleteFlag(): MenuItemWithDelete[] {
  return listMenuItems().map((m) => ({
    ...m,
    can_delete: canDeleteMenuItem(m.menu_id),
  }));
}

export function upsertMenuItem(
  id: number | null,
  item_name: string,
  price: number,
  is_available: boolean,
  image_url: string | null
) {
  const db = getDb();
  const av = is_available ? 1 : 0;
  const img = image_url?.trim() || null;
  if (id == null) {
    db.prepare(
      "INSERT INTO Menu_Item (item_name, price, is_available, image_url) VALUES (?, ?, ?, ?)"
    ).run(item_name, price, av, img);
  } else {
    db.prepare(
      "UPDATE Menu_Item SET item_name = ?, price = ?, is_available = ?, image_url = ? WHERE menu_id = ?"
    ).run(item_name, price, av, img, id);
  }
}

export function deleteMenuItem(id: number) {
  getDb().prepare("DELETE FROM Menu_Item WHERE menu_id = ?").run(id);
}

function nextQueuePosition(db: Database.Database): number {
  const row = db
    .prepare("SELECT COALESCE(MAX(position), 0) + 1 AS n FROM KitchenQueue")
    .get() as { n: number };
  return row.n;
}

export function createOrderWithItems(
  tableId: number,
  lineItems: { menuId: number; quantity: number; specialRequest: string }[],
  orderStatus = "Pending"
): number {
  if (!lineItems.length) throw new Error("Order must include at least one line item");
  const db = getDb();

  const tableOk = db
    .prepare('SELECT 1 FROM "Table" WHERE table_id = ?')
    .get(tableId);
  if (!tableOk) throw new Error("Table not found");

  const menuStmt = db.prepare(
    "SELECT is_available FROM Menu_Item WHERE menu_id = ?"
  );
  for (const li of lineItems) {
    if (!Number.isInteger(li.quantity) || li.quantity < 1) {
      throw new Error("Each line needs a whole-number quantity of at least 1");
    }
    const m = menuStmt.get(li.menuId) as { is_available: number } | undefined;
    if (!m) throw new Error("Unknown menu item on this order");
    if (m.is_available !== 1) {
      throw new Error("One or more items are marked unavailable and cannot be ordered");
    }
  }

  const ts = nowIso();
  const run = db.transaction(() => {
    const r = db
      .prepare(
        'INSERT INTO "Order" (table_id, created_at, order_status, order_number) VALUES (?, ?, ?, NULL)'
      )
      .run(tableId, ts, orderStatus);
    const orderId = Number(r.lastInsertRowid);
    db.prepare('UPDATE "Order" SET order_number = ? WHERE order_id = ?').run(
      orderId,
      orderId
    );
    const ins = db.prepare(
      `INSERT INTO Order_Item (order_id, menu_id, quantity, special_request) VALUES (?, ?, ?, ?)`
    );
    for (const li of lineItems) {
      ins.run(
        orderId,
        li.menuId,
        li.quantity,
        li.specialRequest.trim() || null
      );
    }
    const pos = nextQueuePosition(db);
    db.prepare(
      `INSERT INTO KitchenQueue (order_id, chef_id, position, created_at, status, priority) VALUES (?, NULL, ?, ?, 'Queued', 0)`
    ).run(orderId, pos, ts);
    return orderId;
  });
  return run();
}

export function listOrders(): OrderRow[] {
  return getDb()
    .prepare(
      `SELECT o.order_id, o.table_id, t.table_number, o.created_at, o.order_status, o.order_number
       FROM "Order" o JOIN "Table" t ON t.table_id = o.table_id
       ORDER BY o.order_id DESC`
    )
    .all() as OrderRow[];
}

export function getOrderItems(orderId: number): OrderLine[] {
  return getDb()
    .prepare(
      `SELECT oi.order_item_id, oi.menu_id, m.item_name, oi.quantity, oi.special_request, m.price
       FROM Order_Item oi JOIN Menu_Item m ON m.menu_id = oi.menu_id
       WHERE oi.order_id = ? ORDER BY oi.order_item_id`
    )
    .all(orderId) as OrderLine[];
}

export function mapOrderIdToLines(): Map<number, OrderLine[]> {
  const rows = getDb()
    .prepare(
      `SELECT oi.order_id, oi.order_item_id, oi.menu_id, m.item_name, oi.quantity, oi.special_request, m.price
       FROM Order_Item oi JOIN Menu_Item m ON m.menu_id = oi.menu_id
       ORDER BY oi.order_id DESC, oi.order_item_id ASC`
    )
    .all() as (OrderLine & { order_id: number })[];
  const map = new Map<number, OrderLine[]>();
  for (const row of rows) {
    const { order_id, ...line } = row;
    const list = map.get(order_id) ?? [];
    list.push(line);
    map.set(order_id, list);
  }
  return map;
}

export function updateOrderStatus(orderId: number, status: string) {
  getDb().prepare('UPDATE "Order" SET order_status = ? WHERE order_id = ?').run(status, orderId);
}

export function listKitchenQueue(): QueueRow[] {
  return getDb()
    .prepare(
      `SELECT k.queue_id, k.order_id, k.chef_id, ch.name AS chef_name,
              k.position AS queueNumber, k.created_at, k.status AS Status,
              t.table_number, o.order_status
       FROM KitchenQueue k
       JOIN "Order" o ON o.order_id = k.order_id
       JOIN "Table" t ON t.table_id = o.table_id
       LEFT JOIN Chef ch ON ch.chef_id = k.chef_id
       ORDER BY k.priority DESC, k.position ASC, k.queue_id ASC`
    )
    .all() as QueueRow[];
}

export function updateQueue(
  queueId: number,
  chefId: number | null,
  status: string
) {
  const db = getDb();
  db.prepare("UPDATE KitchenQueue SET chef_id = ?, status = ? WHERE queue_id = ?")
    .run(chefId, status, queueId);

  if (status === "Served") {
    const row = db
      .prepare(
        `SELECT o.table_id FROM KitchenQueue k JOIN "Order" o ON o.order_id = k.order_id WHERE k.queue_id = ?`
      )
      .get(queueId) as { table_id: number } | undefined;
    if (row) {
      regenerateTableQrToken(row.table_id);
    }
  }
}

/** Advance queue status to the next column: Queued→Preparing→Ready→Served */
export function advanceQueueStatus(queueId: number, chefId?: number | null) {
  const db = getDb();
  const row = db
    .prepare("SELECT status, chef_id FROM KitchenQueue WHERE queue_id = ?")
    .get(queueId) as { status: string; chef_id: number | null } | undefined;
  if (!row) return;
  const order = ["Queued", "Preparing", "Ready", "Served"];
  const idx = order.indexOf(row.status);
  if (idx < 0 || idx >= order.length - 1) return;
  const next = order[idx + 1]!;
  const assignedChef = chefId !== undefined ? chefId : row.chef_id;
  updateQueue(queueId, assignedChef, next);
}

/** Remove a served queue entry (marks order Completed too). */
export function removeServedQueueEntry(queueId: number) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT k.status, k.order_id FROM KitchenQueue k WHERE k.queue_id = ?`
    )
    .get(queueId) as { status: string; order_id: number } | undefined;
  if (!row || row.status !== "Served") return;
  db.prepare('UPDATE "Order" SET order_status = ? WHERE order_id = ?').run(
    "Completed",
    row.order_id
  );
  db.prepare("DELETE FROM KitchenQueue WHERE queue_id = ?").run(queueId);
}

export function clearAllData() {
  getDb().exec(`
    DELETE FROM KitchenQueue;
    DELETE FROM Order_Item;
    DELETE FROM "Order";
    DELETE FROM "Table";
    DELETE FROM Menu_Item;
    DELETE FROM Chef;
  `);
}

export function seedRealisticDataset(force: boolean) {
  const db = getDb();
  if (!force) {
    const c = db.prepare('SELECT COUNT(*) AS n FROM "Table"').get() as { n: number };
    if (c.n > 0) return;
  } else {
    clearAllData();
  }

  const tableNumbers = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];
  const chefs: [string, string][] = [
    ["Marco Ruiz", "+1-415-555-1001"],
    ["Aye Chan", "+1-415-555-1002"],
    ["Jordan Mills", "+1-415-555-1003"],
    ["Sofia Andersson", "+1-415-555-1004"],
    ["Dev Patel", "+1-415-555-1005"],
    ["Chris Okafor", "+1-415-555-1006"],
  ];
  const U = (id: string) =>
    `https://images.unsplash.com/${id}?w=400&h=400&fit=crop&q=80`;
  const menu: [string, number, number, string][] = [
    ["Chicken Satay (4pc)", 11.95, 1, U("photo-1555939594-58d7cb561ad1")],
    ["Vegetable Spring Rolls (6pc)", 8.5, 1, U("photo-1617093727343-374954b7b503")],
    ["Crispy Calamari", 14.0, 1, U("photo-1599487488170-d11ec9c172f0")],
    ["Tom Yum Soup", 9.5, 1, U("photo-1547592166-23ac45744acd")],
    ["Tom Kha Gai", 10.5, 1, U("photo-1608212758884-46f3d8967ac0")],
    ["Greek Salad", 12.0, 1, U("photo-1540189549336-e6e99c3679fe")],
    ["Caesar Salad", 11.0, 1, U("photo-1550304943-4f24f54ddde9")],
    ["Pad Thai", 16.5, 1, U("photo-1559314809-0d155014e29e")],
    ["Green Curry (chicken)", 17.5, 1, U("photo-1455619452474-d7be8dd9d59f")],
    ["Massaman Curry (beef)", 18.0, 1, U("photo-1588166526937-336c13fa7f25")],
    ["Grilled Salmon", 24.0, 1, U("photo-1467003909585-2f8a77070184")],
    ["Ribeye Steak (8oz)", 32.0, 1, U("photo-1600891964092-4316c288032e")],
    ["Veggie Burger + fries", 15.5, 1, U("photo-1520072959217-cffc8f2170ef")],
    ["Steamed Jasmine Rice", 3.5, 1, U("photo-1586201375761-83865001e31c")],
    ["Garlic Naan", 4.0, 1, U("photo-1601050690117-94faeaa0d46d")],
    ["Mango Sticky Rice", 8.0, 1, U("photo-1563823253-cc3a63d386db")],
    ["Chocolate Brownie + ice cream", 7.5, 1, U("photo-1607920598183-13fd8ea74312")],
    ["Thai Iced Tea", 4.5, 1, U("photo-1556679343-c7306c19756b")],
    ["Iced Tea (unsweetened)", 3.0, 1, U("photo-1556679343-c7306c19756b")],
    ["Sparkling Water", 3.5, 1, U("photo-1548839140-29a749e1cf4d")],
    ["House Red Wine (glass)", 9.0, 1, U("photo-1510812431401-41d2bd2722f3")],
    ["Truffle Fries (seasonal)", 9.5, 0, U("photo-1573080496219-bb080dd4f877")],
  ];

  const insT = db.prepare(
    'INSERT INTO "Table" (table_number, status, qr_token) VALUES (?, ?, ?)'
  );
  for (const tn of tableNumbers) {
    insT.run(tn, "Available", newQrToken());
  }

  const insCh = db.prepare("INSERT INTO Chef (name, phone) VALUES (?, ?)");
  for (const row of chefs) insCh.run(row[0], row[1]);

  const insM = db.prepare(
    "INSERT INTO Menu_Item (item_name, price, is_available, image_url) VALUES (?, ?, ?, ?)"
  );
  for (const row of menu) insM.run(row[0], row[1], row[2], row[3]);

  const menuByName: Record<string, number> = {};
  for (const r of db.prepare("SELECT menu_id, item_name FROM Menu_Item").all() as {
    menu_id: number;
    item_name: string;
  }[]) {
    menuByName[r.item_name] = r.menu_id;
  }
  const tableIds = (
    db.prepare('SELECT table_id FROM "Table" ORDER BY table_id').all() as {
      table_id: number;
    }[]
  ).map((x) => x.table_id);
  const chefIds = (
    db.prepare("SELECT chef_id FROM Chef ORDER BY chef_id").all() as { chef_id: number }[]
  ).map((x) => x.chef_id);

  type Scenario = [
    number,
    [string, number, string][],
    string,
    number | null,
    string,
  ];
  const scenarios: Scenario[] = [
    [0, [["Pad Thai", 2, "Extra lime, mild spice"], ["Thai Iced Tea", 2, ""]], "Pending", null, "Queued"],
    [
      1,
      [
        ["Green Curry (chicken)", 1, "No fish sauce"],
        ["Steamed Jasmine Rice", 2, ""],
      ],
      "In progress",
      0,
      "Preparing",
    ],
    [
      2,
      [
        ["Grilled Salmon", 1, "Medium"],
        ["Greek Salad", 1, "Dressing on the side"],
      ],
      "In progress",
      1,
      "Preparing",
    ],
    [
      3,
      [
        ["Ribeye Steak (8oz)", 2, ""],
        ["Garlic Naan", 2, ""],
        ["House Red Wine (glass)", 2, ""],
      ],
      "Completed",
      2,
      "Ready",
    ],
    [
      4,
      [
        ["Vegetable Spring Rolls (6pc)", 3, ""],
        ["Tom Yum Soup", 3, "Extra mushrooms"],
      ],
      "Pending",
      null,
      "Queued",
    ],
    [
      5,
      [
        ["Massaman Curry (beef)", 4, "Corporate lunch — nut allergy table"],
        ["Steamed Jasmine Rice", 8, "Split platters"],
        ["Iced Tea (unsweetened)", 6, ""],
      ],
      "In progress",
      3,
      "Preparing",
    ],
    [
      6,
      [["Veggie Burger + fries", 1, "No mayo"], ["Sparkling Water", 1, ""]],
      "Completed",
      4,
      "Served",
    ],
    [
      7,
      [
        ["Mango Sticky Rice", 2, ""],
        ["Chocolate Brownie + ice cream", 1, "Extra whipped cream"],
      ],
      "Completed",
      5,
      "Served",
    ],
    [
      8,
      [
        ["Chicken Satay (4pc)", 20, "Office party — 20 skewers"],
        ["Crispy Calamari", 10, ""],
        ["Thai Iced Tea", 15, ""],
      ],
      "In progress",
      0,
      "Preparing",
    ],
    [
      9,
      [
        ["Tom Kha Gai", 1, ""],
        ["Pad Thai", 1, "Gluten-free noodles if possible"],
      ],
      "Cancelled",
      null,
      "Queued",
    ],
  ];

  const tablesWithOrders = new Set<number>();
  for (const [ti, rawLines, ostatus, chefIdx, qstatus] of scenarios) {
    const tid = tableIds[ti]!;
    tablesWithOrders.add(tid);
    const lines = rawLines.map(([name, qty, spec]) => ({
      menuId: menuByName[name]!,
      quantity: qty,
      specialRequest: spec,
    }));
    const orderId = createOrderWithItems(tid, lines, ostatus);
    const row = db
      .prepare("SELECT queue_id FROM KitchenQueue WHERE order_id = ?")
      .get(orderId) as { queue_id: number };
    const chefId = chefIdx !== null ? chefIds[chefIdx]! : null;
    updateQueue(row.queue_id, chefId, qstatus);
  }

  const setOccupied = db.prepare(
    'UPDATE "Table" SET status = ? WHERE table_id = ?'
  );
  for (const tid of tablesWithOrders) {
    setOccupied.run("Occupied", tid);
  }
}

export function seedDemoData() {
  seedRealisticDataset(false);
}
