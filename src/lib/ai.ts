import { z } from "zod";
import { BLOOD_GROUPS } from "./constants";

export const ExtractSchema = z.object({
  category: z.enum(["BLOOD", "OXYGEN", "ICU_BED", "VENTILATOR", "ORGAN", "UNKNOWN"]),
  subtype: z.string().default(""),
  quantity: z.number().int().min(1).max(50).default(1),
  urgency: z.number().min(0).max(100).default(50),
  confidence: z.number().min(0).max(1).default(0.5),
});
export type Extracted = z.infer<typeof ExtractSchema>;

const SYSTEM = `You extract structured data from an emergency medical resource request written in plain language (English or Hinglish).
Return ONLY a JSON object: {"category": "BLOOD|OXYGEN|ICU_BED|VENTILATOR|ORGAN|UNKNOWN", "subtype": string, "quantity": integer, "urgency": 0-100, "confidence": 0-1}.
- For BLOOD, subtype is one blood group: A+, A-, B+, B-, AB+, AB-, O+, O-. For other categories use "Cylinder", "ICU" or "Standard".
- ORGAN covers any organ or tissue request. quantity defaults to 1. urgency reflects how life-threatening the situation sounds.
- confidence is how sure you are about category and subtype. Use UNKNOWN with low confidence if unclear. Do not invent details.`;

function normalizeSubtype(category: string, raw: string) {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "").replace("POSITIVE", "+").replace("NEGATIVE", "-");
  if (category === "BLOOD") return BLOOD_GROUPS.includes(s) ? s : "";
  if (category === "OXYGEN") return "Cylinder";
  if (category === "ICU_BED") return "ICU";
  if (category === "VENTILATOR") return "Standard";
  return "";
}

/** Offline fallback so the app still works without an LLM key. */
export function heuristicExtract(text: string): Extracted {
  const t = text.toLowerCase();
  let category: Extracted["category"] = "UNKNOWN";
  if (/organ|kidney|liver|cornea|transplant/.test(t)) category = "ORGAN";
  else if (/ventilator/.test(t)) category = "VENTILATOR";
  else if (/icu|intensive/.test(t)) category = "ICU_BED";
  else if (/oxygen|o2|cylinder/.test(t)) category = "OXYGEN";
  else if (/blood|platelet|plasma|\b(ab|a|b|o)\s?(\+|-|positive|negative)/i.test(t)) category = "BLOOD";
  let subtype = "";
  const m = text.match(/\b(ab|a|b|o)\s?(\+|-|positive|negative|pos|neg)/i);
  if (m) subtype = m[1].toUpperCase() + (/^(\+|pos)/i.test(m[2]) ? "+" : "-");
  const q = text.match(/\b(\d{1,2})\s*(units?|cylinders?|beds?|bags?|ventilators?)?\b/i);
  const quantity = q ? Math.min(50, Math.max(1, parseInt(q[1], 10))) : 1;
  return { category, subtype: normalizeSubtype(category, subtype), quantity, urgency: 50, confidence: category === "UNKNOWN" ? 0.2 : 0.5 };
}

export async function extractRequest(text: string): Promise<Extracted & { source: "llm" | "fallback" }> {
  const key = process.env.LLM_API_KEY;
  if (!key) return { ...heuristicExtract(text), source: "fallback" };
  try {
    const res = await fetch(`${process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1"}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: text }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}`);
    const data = await res.json();
    const parsed = ExtractSchema.parse(JSON.parse(data.choices[0].message.content));
    parsed.subtype = normalizeSubtype(parsed.category, parsed.subtype);
    return { ...parsed, source: "llm" };
  } catch {
    return { ...heuristicExtract(text), source: "fallback" };
  }
}
