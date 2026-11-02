import { db } from "@/lib/db";
import { fail, ok } from "@/lib/api";
import { tickSla } from "@/lib/sla";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  await tickSla();
  const r = await db.request.findUnique({
    where: { trackingToken: params.token },
    include: { matches: { include: { facility: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!r) return fail("We could not find this request.", 404);

  const confirmed = r.matches.find((m) => m.status === "CONFIRMED");
  const open = r.matches.find((m) => m.status === "OFFERED");
  return ok({
    status: r.status, category: r.category, subtype: r.subtype, quantity: r.quantity,
    urgencyScore: r.urgencyScore, llmUrgency: r.llmUrgency, keywordScore: r.keywordScore,
    radiusKm: r.radiusKm, createdAt: r.createdAt, deadlineAt: r.deadlineAt, escalatedAt: r.escalatedAt,
    attempts: r.matches.length,
    current: open ? { facility: open.facility.name, distanceKm: open.distanceKm } : null,
    // Contact details are shared only after a facility confirms.
    facility: confirmed
      ? { name: confirmed.facility.name, phone: confirmed.facility.phone, area: confirmed.facility.area, lat: confirmed.facility.lat, lng: confirmed.facility.lng, distanceKm: confirmed.distanceKm }
      : null,
  });
}
