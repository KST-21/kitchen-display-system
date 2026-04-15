import { OrderStatus } from "@prisma/client";

export type OrderRow = {
  order_id: number;
  table_id: number;
  table_number: string;
  created_at: string;
  order_status: OrderStatus;
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
