import { db } from "@/lib/db";
import { fail, ok, requireAdmin } from "@/lib/api";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return fail("Admin access only.", 401);
  await db.adminAlert.update({ where: { id: params.id }, data: { resolved: true } });
  return ok({ ok: true });
}
