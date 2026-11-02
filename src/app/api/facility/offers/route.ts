import { db } from "@/lib/db";
import { fail, ok, requireFacility } from "@/lib/api";
import { tickSla } from "@/lib/sla";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireFacility();
  if (!s) return fail("Sign in as a facility.", 401);
  await tickSla();
  const [open, history] = await Promise.all([
    db.requestMatch.findMany({
      where: { facilityId: s.facilityId, status: "OFFERED", offerExpiresAt: { gt: new Date() } },
      include: { request: true }, orderBy: { createdAt: "asc" },
    }),
    db.requestMatch.findMany({
      where: { facilityId: s.facilityId, status: "CONFIRMED" },
      include: { request: true }, orderBy: { createdAt: "desc" }, take: 10,
    }),
  ]);
  const pick = (m: (typeof open)[number], withPhone: boolean) => ({
    id: m.id, distanceKm: m.distanceKm, offerExpiresAt: m.offerExpiresAt, createdAt: m.createdAt,
    request: {
      category: m.request.category, subtype: m.request.subtype, quantity: m.request.quantity,
      urgencyScore: m.request.urgencyScore, rawText: m.request.rawText, deadlineAt: m.request.deadlineAt,
      escalated: m.request.status === "ESCALATED",
      contactPhone: withPhone ? m.request.contactPhone : null,
    },
  });
  return ok({ open: open.map((m) => pick(m, false)), confirmed: history.map((m) => pick(m, true)) });
}
