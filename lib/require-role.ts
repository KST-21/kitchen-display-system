import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { Role } from "@prisma/client";

export const requireRole = async (roles: Role[]) => {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!roles.includes(session.role)) {
    redirect("/login");
  }

  return session;
};

export const hasRole = async (roles: Role[]) => {
  const session = await getSession();
  if (!session) return false;

  return roles.includes(session.role);
};

export const requireRoleAction = async (roles: Role[]) => {
  const allowed = await hasRole(roles);
  if (!allowed) {
    throw new Error("Unauthorized");
  }
};
