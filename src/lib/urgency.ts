// Hybrid urgency score: LLM suggestion blended with deterministic keyword severity.
export const KEYWORD_WEIGHTS: Record<string, number> = {
  accident: 20, critical: 25, surgery: 15, hemorrhage: 30, haemorrhage: 30,
  bleeding: 20, emergency: 10, urgent: 10, urgently: 10, icu: 10, unconscious: 25,
  "cardiac arrest": 30, "heart attack": 25, delivery: 10, pregnant: 10, dengue: 10,
};
export const ALPHA = 0.6; // weight of the LLM score

export function keywordScore(text: string) {
  const t = text.toLowerCase();
  let sum = 0;
  const hits: string[] = [];
  for (const [k, w] of Object.entries(KEYWORD_WEIGHTS)) {
    if (t.includes(k)) { sum += w; hits.push(k); }
  }
  return { score: Math.min(100, sum), hits };
}

export function hybridUrgency(text: string, llm: number | null | undefined) {
  const { score: kw, hits } = keywordScore(text);
  const urgency = llm == null ? Math.min(100, 30 + kw) : Math.min(100, Math.round(ALPHA * llm + (1 - ALPHA) * kw));
  return { urgency, keywordScore: kw, hits };
}

export function radiusForUrgency(u: number) {
  return u >= 70 ? 30 : u >= 40 ? 20 : 10;
}

export function urgencyLabel(u: number) {
  return u >= 70 ? "Critical" : u >= 40 ? "High" : "Moderate";
}
