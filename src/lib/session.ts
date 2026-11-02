import { cookies } from "next/headers";
import { COOKIE, readToken, type Session } from "./jwt";

export async function getSession(): Promise<Session | null> {
  return readToken(cookies().get(COOKIE)?.value);
}
