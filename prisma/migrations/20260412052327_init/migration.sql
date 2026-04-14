-- CreateTable
CREATE TABLE "Table" (
    "table_id" SERIAL NOT NULL,
    "table_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "qr_token" TEXT NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("table_id")
);

-- CreateTable
CREATE TABLE "Chef" (
    "chef_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "Chef_pkey" PRIMARY KEY ("chef_id")
);

-- CreateTable
CREATE TABLE "Menu_Item" (
    "menu_id" SERIAL NOT NULL,
    "item_name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,

    CONSTRAINT "Menu_Item_pkey" PRIMARY KEY ("menu_id")
);

-- CreateTable
CREATE TABLE "Order" (
    "order_id" SERIAL NOT NULL,
    "table_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_status" TEXT NOT NULL DEFAULT 'Pending',
    "order_number" INTEGER,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "Order_Item" (
    "order_item_id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "special_request" TEXT,

    CONSTRAINT "Order_Item_pkey" PRIMARY KEY ("order_item_id")
);

-- CreateTable
CREATE TABLE "KitchenQueue" (
    "queue_id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "chef_id" INTEGER,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Queued',
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "KitchenQueue_pkey" PRIMARY KEY ("queue_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Table_table_number_key" ON "Table"("table_number");

-- CreateIndex
CREATE UNIQUE INDEX "Table_qr_token_key" ON "Table"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenQueue_order_id_key" ON "KitchenQueue"("order_id");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "Table"("table_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order_Item" ADD CONSTRAINT "Order_Item_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order_Item" ADD CONSTRAINT "Order_Item_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "Menu_Item"("menu_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenQueue" ADD CONSTRAINT "KitchenQueue_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenQueue" ADD CONSTRAINT "KitchenQueue_chef_id_fkey" FOREIGN KEY ("chef_id") REFERENCES "Chef"("chef_id") ON DELETE SET NULL ON UPDATE CASCADE;
