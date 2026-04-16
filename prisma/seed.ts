import "dotenv/config";
import {
  OrderStatus,
  PrismaClient,
  QueueStatus,
  TableStatus,
} from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const U = (id: string) =>
  `https://images.unsplash.com/${id}?w=400&h=400&fit=crop&q=80`;

const main = async () => {
  console.log("🌱 Seeding database...");

  await prisma.kitchenQueue.deleteMany();
  await prisma.order_Item.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menu_Item.deleteMany();
  await prisma.chef.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("1234", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Admin",
        email: "admin@test.com",
        password,
        role: "ADMIN",
      },
      {
        name: "Staff",
        email: "staff@test.com",
        password,
        role: "STAFF",
      },
    ],
  });

  const tableNumbers = Array.from({ length: 12 }, (_, i) => String(i + 1));

  const tables = await Promise.all(
    tableNumbers.map((tn) =>
      prisma.table.create({
        data: {
          table_number: tn,
          status: TableStatus.Available,
          qr_token: crypto.randomUUID(),
        },
      }),
    ),
  );

  const chefs = await Promise.all(
    [
      { name: "Marco Ruiz", phone: "+1-415-555-1001" },
      { name: "Aye Chan", phone: "+1-415-555-1002" },
      { name: "Jordan Mills", phone: "+1-415-555-1003" },
      { name: "Sofia Andersson", phone: "+1-415-555-1004" },
      { name: "Dev Patel", phone: "+1-415-555-1005" },
      { name: "Chris Okafor", phone: "+1-415-555-1006" },
    ].map((c) => prisma.chef.create({ data: c })),
  );

  const menuData = [
    ["Chicken Satay (4pc)", 11.95, true, U("photo-1555939594-58d7cb561ad1")],
    [
      "Vegetable Spring Rolls (6pc)",
      8.5,
      true,
      U("photo-1617093727343-374954b7b503"),
    ],
    ["Crispy Calamari", 14.0, true, U("photo-1599487488170-d11ec9c172f0")],
    ["Tom Yum Soup", 9.5, true, U("photo-1547592166-23ac45744acd")],
    ["Tom Kha Gai", 10.5, true, U("photo-1608212758884-46f3d8967ac0")],
    ["Greek Salad", 12.0, true, U("photo-1540189549336-e6e99c3679fe")],
    ["Caesar Salad", 11.0, true, U("photo-1550304943-4f24f54ddde9")],
    ["Pad Thai", 16.5, true, U("photo-1559314809-0d155014e29e")],
    [
      "Green Curry (chicken)",
      17.5,
      true,
      U("photo-1455619452474-d7be8dd9d59f"),
    ],
    [
      "Massaman Curry (beef)",
      18.0,
      true,
      U("photo-1588166526937-336c13fa7f25"),
    ],
    ["Grilled Salmon", 24.0, true, U("photo-1467003909585-2f8a77070184")],
    ["Ribeye Steak (8oz)", 32.0, true, U("photo-1600891964092-4316c288032e")],
    [
      "Veggie Burger + fries",
      15.5,
      true,
      U("photo-1520072959217-cffc8f2170ef"),
    ],
    ["Steamed Jasmine Rice", 3.5, true, U("photo-1586201375761-83865001e31c")],
    ["Garlic Naan", 4.0, true, U("photo-1601050690117-94faeaa0d46d")],
    ["Mango Sticky Rice", 8.0, true, U("photo-1563823253-cc3a63d386db")],
    [
      "Chocolate Brownie + ice cream",
      7.5,
      true,
      U("photo-1607920598183-13fd8ea74312"),
    ],
    ["Thai Iced Tea", 4.5, true, U("photo-1556679343-c7306c19756b")],
    ["Iced Tea (unsweetened)", 3.0, true, U("photo-1556679343-c7306c19756b")],
    ["Sparkling Water", 3.5, true, U("photo-1548839140-29a749e1cf4d")],
    [
      "House Red Wine (glass)",
      9.0,
      true,
      U("photo-1510812431401-41d2bd2722f3"),
    ],
    [
      "Truffle Fries (seasonal)",
      9.5,
      false,
      U("photo-1573080496219-bb080dd4f877"),
    ],
  ];

  const menu = await Promise.all(
    menuData.map(([name, price, available, img]) =>
      prisma.menu_Item.create({
        data: {
          item_name: name as string,
          price: price as number,
          is_available: available as boolean,
          image_url: img as string,
        },
      }),
    ),
  );

  const menuByName: Record<string, number> = {};
  menu.forEach((m) => {
    menuByName[m.item_name] = m.menu_id;
  });

  const scenarios = [
    [
      0,
      [
        { name: "Pad Thai", qty: 2, spec: "Extra lime" },
        { name: "Thai Iced Tea", qty: 2, spec: "" },
      ],
      OrderStatus.Pending,
      null,
      QueueStatus.Queued,
    ],
    [
      1,
      [
        { name: "Green Curry (chicken)", qty: 1, spec: "" },
        { name: "Pad Thai", qty: 1, spec: "" },
      ],
      OrderStatus.InProgress,
      0,
      QueueStatus.Preparing,
    ],
  ] as const;

  for (const [ti, items, orderStatus, chefIdx, queueStatus] of scenarios) {
    const table = tables[ti];

    const order = await prisma.order.create({
      data: {
        table_id: table.table_id,
        order_status: orderStatus,
      },
    });

    await prisma.order.update({
      where: { order_id: order.order_id },
      data: { order_number: order.order_id },
    });

    for (const item of items) {
      await prisma.order_Item.create({
        data: {
          order_id: order.order_id,
          menu_id: menuByName[item.name],
          quantity: item.qty,
          special_request: item.spec || null,
        },
      });
    }

    const max = await prisma.kitchenQueue.aggregate({
      _max: { position: true },
    });

    await prisma.kitchenQueue.create({
      data: {
        order_id: order.order_id,
        chef_id: chefIdx !== null ? chefs[chefIdx].chef_id : null,
        position: (max._max.position ?? 0) + 1,
        status: queueStatus,
      },
    });

    await prisma.table.update({
      where: { table_id: table.table_id },
      data: { status: "Occupied" },
    });
  }

  console.log("✅ Seeding completed!");
};

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
