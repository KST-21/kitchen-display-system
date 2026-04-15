import { TableStatus, OrderStatus, QueueStatus } from "@prisma/client";

export const TABLE_STATUSES = Object.values(TableStatus);
export const ORDER_STATUSES = Object.values(OrderStatus);
export const QUEUE_STATUSES = Object.values(QueueStatus);
