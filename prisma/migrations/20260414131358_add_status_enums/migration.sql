/*
  Warnings:

  - The `status` column on the `KitchenQueue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `order_status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Table` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('Available', 'Occupied', 'Reserved', 'Cleaning');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('Pending', 'InProgress', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('Queued', 'Preparing', 'Ready', 'Served');

-- AlterTable
ALTER TABLE "KitchenQueue" DROP COLUMN "status",
ADD COLUMN     "status" "QueueStatus" NOT NULL DEFAULT 'Queued';

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "order_status",
ADD COLUMN     "order_status" "OrderStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "status",
ADD COLUMN     "status" "TableStatus" NOT NULL DEFAULT 'Available';
