import { QueueStatus } from "@prisma/client";

export type QueueRow = {
  queue_id: number;
  order_id: number;
  chef_id: number | null;
  chef_name: string | null;
  queueNumber: number;
  created_at: string;
  Status: QueueStatus;
  table_number: string;
  order_status: string;
};
