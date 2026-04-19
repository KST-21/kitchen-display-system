import { TableSessionStatus } from "@prisma/client";

export type TableSession = {
  session_id: number;
  table_id: number;
  hash: string;
  status: TableSessionStatus;
  created_at: string;
};
