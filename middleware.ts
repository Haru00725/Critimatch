import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, readToken } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const s = await readToken(req.cookies.get(COOKIE)?.value);
  const path = req.nextUrl.pathname;
  const needs = path.startsWith("/admin") ? "ADMIN" : "FACILITY";
  if (!s || s.role !== needs) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/facility/:path*", "/admin/:path*"] };
