import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, rateLimited } from "@/lib/api";
import { COOKIE, signSession } from "@/lib/jwt";

const Body = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  if (rateLimited(req, "login", 10)) return fail("Too many attempts. Try again in a minute.", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter a valid email and password.");
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return fail("Email or password is incorrect.", 401);

  const token = await signSession({ uid: user.id, role: user.role, facilityId: user.facilityId, email: user.email });
  const res = NextResponse.json({ role: user.role });
  res.cookies.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
