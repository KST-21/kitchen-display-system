/*
  Warnings:

  - You are about to drop the column `order_id` on the `KitchenQueue` table. All the data in the column will be lost.
  - You are about to drop the column `qr_token` on the `Table` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order_item_id]` on the table `KitchenQueue` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_item_id` to the `KitchenQueue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_id` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TableSessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- DropForeignKey
ALTER TABLE "KitchenQueue" DROP CONSTRAINT "KitchenQueue_order_id_fkey";

-- DropIndex
DROP INDEX "KitchenQueue_order_id_key";

-- DropIndex
DROP INDEX "Table_qr_token_key";

-- AlterTable
ALTER TABLE "KitchenQueue" DROP COLUMN "order_id",
ADD COLUMN     "order_item_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "session_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "qr_token";

-- CreateTable
CREATE TABLE "TableSession" (
    "session_id" SERIAL NOT NULL,
    "table_id" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "status" "TableSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TableSession_hash_key" ON "TableSession"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "KitchenQueue_order_item_id_key" ON "KitchenQueue"("order_item_id");

-- AddForeignKey
ALTER TABLE "TableSession" ADD CONSTRAINT "TableSession_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "Table"("table_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "TableSession"("session_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitchenQueue" ADD CONSTRAINT "KitchenQueue_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "Order_Item"("order_item_id") ON DELETE CASCADE ON UPDATE CASCADE;
