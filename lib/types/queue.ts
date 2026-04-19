import { QueueStatus } from "@prisma/client";

export type QueueRow = {
  queue_id: number;

  order_item_id: number;
  item_name: string;
  quantity: number;
  special_request: string | null;

  order_id: number;
  table_number: string;

  chef_id: number | null;
  chef_name: string | null;

  queueNumber: number;
  created_at: string;
  Status: QueueStatus;
};
