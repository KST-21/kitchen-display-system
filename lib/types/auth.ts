import { Role } from "@prisma/client";

export type SessionUser = {
  id: number;
  role: Role;
};
