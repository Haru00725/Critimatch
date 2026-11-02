import { db } from "./db";
import { haversineKm } from "./haversine";

export const OFFER_WINDOW_MIN = 15;

/** Offer the request to the nearest eligible facility that has not been tried yet. */
export async function offerNext(requestId: string) {
  const req = await db.request.findUnique({ where: { id: requestId }, include: { matches: true } });
  if (!req || req.status === "CONFIRMED" || req.status === "CANCELLED") return null;
  if (req.matches.some((m) => m.status === "OFFERED" && m.offerExpiresAt > new Date())) return null; // offer already open

  const tried = new Set(req.matches.map((m) => m.facilityId));
  const facilities = await db.facility.findMany({
    where: {
      verified: true,
      id: { notIn: [...tried] },
      inventory: { some: { category: req.category, subtype: req.subtype, quantity: { gte: req.quantity } } },
    },
  });

  const ranked = facilities
    .map((f) => ({ f, d: haversineKm(req.lat, req.lng, f.lat, f.lng) }))
    .filter((x) => x.d <= req.radiusKm)
    .sort((a, b) => a.d - b.d);

  if (ranked.length === 0) {
    if (req.status === "OFFERED") await db.request.update({ where: { id: req.id }, data: { status: "PENDING" } });
    return null;
  }

  const best = ranked[0];
  const match = await db.requestMatch.create({
    data: {
      requestId: req.id,
      facilityId: best.f.id,
      distanceKm: Math.round(best.d * 10) / 10,
      offerExpiresAt: new Date(Date.now() + OFFER_WINDOW_MIN * 60_000),
    },
  });
  await db.request.update({
    where: { id: req.id },
    data: { status: req.status === "ESCALATED" ? "ESCALATED" : "OFFERED" },
  });
  return match;
}

/** Facility confirms. Stock is decremented atomically so two facilities cannot double-allocate. */
export async function confirmMatch(matchId: string, facilityId: string) {
  const match = await db.requestMatch.findUnique({ where: { id: matchId }, include: { request: true } });
  if (!match || match.facilityId !== facilityId) return { ok: false as const, error: "Offer not found." };
  if (match.status !== "OFFERED") return { ok: false as const, error: "This offer is no longer open." };
  if (match.offerExpiresAt < new Date()) return { ok: false as const, error: "This offer has expired." };
  if (match.request.status === "CONFIRMED") return { ok: false as const, error: "Request was already matched." };

  try {
    await db.$transaction(async (tx) => {
      const r = await tx.inventoryItem.updateMany({
        where: { facilityId, category: match.request.category, subtype: match.request.subtype, quantity: { gte: match.request.quantity } },
        data: { quantity: { decrement: match.request.quantity } },
      });
      if (r.count === 0) throw new Error("STOCK_CHANGED");
      await tx.requestMatch.update({ where: { id: matchId }, data: { status: "CONFIRMED" } });
      await tx.request.update({ where: { id: match.requestId }, data: { status: "CONFIRMED" } });
    });
    return { ok: true as const };
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK_CHANGED") {
      await db.requestMatch.update({ where: { id: matchId }, data: { status: "DECLINED" } });
      await offerNext(match.requestId);
      return { ok: false as const, error: "Stock is no longer available. The request moved to the next facility." };
    }
    throw e;
  }
}

export async function declineMatch(matchId: string, facilityId: string) {
  const match = await db.requestMatch.findUnique({ where: { id: matchId } });
  if (!match || match.facilityId !== facilityId || match.status !== "OFFERED") return { ok: false as const, error: "Offer not found." };
  await db.requestMatch.update({ where: { id: matchId }, data: { status: "DECLINED" } });
  await offerNext(match.requestId);
  return { ok: true as const };
}
