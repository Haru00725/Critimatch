import { z } from "zod";
import { extractRequest } from "@/lib/ai";
import { fail, ok, rateLimited } from "@/lib/api";
import { hybridUrgency } from "@/lib/urgency";

const Body = z.object({ text: z.string().min(3).max(1000) });
const CONFIDENCE_THRESHOLD = 0.6;

export async function POST(req: Request) {
  if (rateLimited(req, "extract", 15)) return fail("Too many requests. Wait a minute and try again.", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Describe what you need in a sentence or two.");

  const x = await extractRequest(parsed.data.text);
  if (x.category === "ORGAN") return ok({ organ: true });

  const valid = x.category !== "UNKNOWN" && x.subtype !== "";
  const needsManualForm = !valid || x.confidence < CONFIDENCE_THRESHOLD;
  const { urgency, hits } = hybridUrgency(parsed.data.text, x.urgency);
  return ok({
    organ: false,
    needsManualForm,
    source: x.source,
    fields: { category: x.category === "UNKNOWN" ? "BLOOD" : x.category, subtype: x.subtype, quantity: x.quantity },
    confidence: x.confidence,
    llmUrgency: x.source === "llm" ? x.urgency : null,
    urgencyPreview: urgency,
    keywordHits: hits,
  });
}
