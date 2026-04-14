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
