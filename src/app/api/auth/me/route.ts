import { ok } from "@/lib/api";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  return ok(s ? { role: s.role, email: s.email } : { role: null });
}
