import { db } from "@/lib/db";
import { fail, ok, requireAdmin } from "@/lib/api";
import { tickSla } from "@/lib/sla";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("Admin access only.", 401);
  await tickSla();
  const [facilities, alerts, grouped] = await Promise.all([
    db.facility.findMany({ orderBy: [{ verified: "asc" }, { createdAt: "desc" }] }),
    db.adminAlert.findMany({ where: { resolved: false }, include: { request: true }, orderBy: { createdAt: "desc" } }),
    db.request.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return ok({
    facilities,
    alerts: alerts.map((a) => ({
      id: a.id, message: a.message, createdAt: a.createdAt,
      request: { token: a.request.trackingToken, category: a.request.category, subtype: a.request.subtype, quantity: a.request.quantity, urgencyScore: a.request.urgencyScore, contactPhone: a.request.contactPhone, status: a.request.status },
    })),
    stats: Object.fromEntries(grouped.map((g) => [g.status, g._count._all])),
  });
}
