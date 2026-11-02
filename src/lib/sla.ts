import { db } from "./db";
import { offerNext } from "./match";

let lastRun = 0;

/** Expires stale offers, retries waiting requests and escalates anything past its 1-hour deadline. */
export async function runSla() {
  const now = new Date();
  lastRun = Date.now();

  const expired = await db.requestMatch.findMany({ where: { status: "OFFERED", offerExpiresAt: { lt: now } } });
  for (const m of expired) {
    await db.requestMatch.update({ where: { id: m.id }, data: { status: "EXPIRED" } });
    await offerNext(m.requestId);
  }

  const late = await db.request.findMany({ where: { status: { in: ["PENDING", "OFFERED"] }, deadlineAt: { lt: now } } });
  for (const r of late) {
    await db.request.update({ where: { id: r.id }, data: { status: "ESCALATED", escalatedAt: now, radiusKm: r.radiusKm * 2 } });
    await db.adminAlert.create({
      data: { requestId: r.id, message: "Not matched within the 1-hour window. Search radius doubled." },
    });
    await offerNext(r.id);
  }

  const waiting = await db.request.findMany({ where: { status: { in: ["PENDING", "ESCALATED"] } }, select: { id: true } });
  for (const r of waiting) await offerNext(r.id);

  return { expired: expired.length, escalated: late.length };
}

/** Lets pages trigger the watcher on demand (at most every 20 s) so the demo works without a cron job. */
export async function tickSla() {
  if (Date.now() - lastRun > 20_000) await runSla();
}
