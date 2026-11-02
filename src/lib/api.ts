import { NextResponse } from "next/server";
import { getSession } from "./session";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function requireFacility() {
  const s = await getSession();
  if (!s || s.role !== "FACILITY" || !s.facilityId) return null;
  return s as typeof s & { facilityId: string };
}
export async function requireAdmin() {
  const s = await getSession();
  return s && s.role === "ADMIN" ? s : null;
}

// Tiny in-memory rate limiter for public routes (per server instance).
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, key: string, max = 20, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(k, arr);
  return arr.length > max;
}
