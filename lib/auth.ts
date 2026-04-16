import { cookies } from "next/headers";
import { SessionUser } from "./types";

const SESSION_KEY = "user";

export const setSession = async (user: SessionUser) => {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_KEY, JSON.stringify(user), {
    httpOnly: true,
  });
};

export const getSession = async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();

  const cookie = cookieStore.get(SESSION_KEY);
  if (!cookie) return null;

  return JSON.parse(cookie.value);
};

export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_KEY);
};
