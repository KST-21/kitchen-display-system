export type RestaurantTable = {
  table_id: number;
  table_number: string;
  status: string;
  qr_token: string;
};

export type RestaurantTableWithDelete = RestaurantTable & {
  can_delete: boolean;
};
