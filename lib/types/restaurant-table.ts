import { TableStatus } from "@prisma/client";

export type RestaurantTable = {
  table_id: number;
  table_number: string;
  status: TableStatus;
};

export type RestaurantTableWithDelete = RestaurantTable & {
  can_delete: boolean;
};
