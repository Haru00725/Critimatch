import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, rateLimited } from "@/lib/api";
import { CATEGORIES, SUBTYPES } from "@/lib/constants";
import { offerNext } from "@/lib/match";
import { hybridUrgency, radiusForUrgency } from "@/lib/urgency";

const Body = z.object({
  rawText: z.string().min(3).max(1000),
  category: z.enum(CATEGORIES),
  subtype: z.string().min(1).max(30),
  quantity: z.number().int().min(1).max(50),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  contactPhone: z.string().min(8).max(20),
  llmUrgency: z.number().min(0).max(100).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export async function POST(req: Request) {
  if (rateLimited(req, "request", 6)) return fail("Too many requests from this device. Wait a minute.", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Some details are missing or invalid. Check the form and try again.");
  const d = parsed.data;
  if (!SUBTYPES[d.category].includes(d.subtype)) return fail("Choose a valid type for this resource.");

  const { urgency, keywordScore } = hybridUrgency(d.rawText, d.llmUrgency ?? null);
  const request = await db.request.create({
    data: {
      trackingToken: randomBytes(12).toString("hex"),
      rawText: d.rawText, category: d.category, subtype: d.subtype, quantity: d.quantity,
      lat: d.lat, lng: d.lng, contactPhone: d.contactPhone,
      llmUrgency: d.llmUrgency ?? null, keywordScore, urgencyScore: urgency, confidence: d.confidence ?? null,
      radiusKm: radiusForUrgency(urgency),
      deadlineAt: new Date(Date.now() + 60 * 60_000),
    },
  });
  await offerNext(request.id);
  return ok({ token: request.trackingToken }, 201);
}
