import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, requireAdmin } from "@/lib/api";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return fail("Admin access only.", 401);
  const parsed = z.object({ verified: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Invalid request.");
  await db.facility.update({ where: { id: params.id }, data: { verified: parsed.data.verified } });
  return ok({ ok: true });
}
