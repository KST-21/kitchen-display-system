export type MenuItem = {
  menu_id: number;
  item_name: string;
  price: number;
  is_available: boolean;
  /** Optional photo URL (https) or site path (e.g. /menu/item.jpg). */
  image_url: string | null;
};

export type MenuItemWithDelete = MenuItem & { can_delete: boolean };
