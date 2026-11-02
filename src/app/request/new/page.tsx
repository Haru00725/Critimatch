"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AREAS, CATEGORIES, CATEGORY_LABEL, SUBTYPES, type CategoryT } from "@/lib/constants";
import { send } from "@/lib/client";
import { UrgencyPill } from "@/components/ui";

type Extract = {
  organ: boolean; needsManualForm?: boolean; source?: "llm" | "fallback";
  fields?: { category: CategoryT; subtype: string; quantity: number };
  confidence?: number; llmUrgency?: number | null; urgencyPreview?: number; keywordHits?: string[];
};

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState(params.get("text") ?? "");
  const [x, setX] = useState<Extract | null>(null);
  const [category, setCategory] = useState<CategoryT>("BLOOD");
  const [subtype, setSubtype] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [areaIdx, setAreaIdx] = useState(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (params.get("text")) analyze(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function analyze() {
    if (text.trim().length < 3) return setError("Describe what you need in a sentence or two.");
    setBusy(true); setError("");
    const r = await send<Extract>("/api/requests/extract", "POST", { text });
    setBusy(false);
    if (!r.ok) return setError(r.data.error || "Something went wrong.");
    setX(r.data);
    if (r.data.fields) {
      setCategory(r.data.fields.category);
      setSubtype(r.data.fields.subtype || SUBTYPES[r.data.fields.category][0]);
      setQuantity(r.data.fields.quantity);
    }
  }

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setError("We could not read your location. Pick an area from the list instead."),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const loc = coords ?? AREAS[areaIdx];
    const r = await send<{ token: string }>("/api/requests", "POST", {
      rawText: text, category, subtype, quantity, lat: loc.lat, lng: loc.lng, contactPhone: phone,
      llmUrgency: x?.llmUrgency ?? null, confidence: x?.confidence ?? null,
    });
    setBusy(false);
    if (!r.ok) return setError(r.data.error || "Could not send the request.");
    router.push(`/request/${r.data.token}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-crimson-dark">Request a resource</h1>
      <p className="mt-2 text-mute">Describe the emergency in your own words. We will turn it into a request you can check before it is sent.</p>

      <div className="card mt-6 p-6">
        <label htmlFor="text" className="label">What do you need?</label>
        <textarea id="text" rows={4} className="input resize-none" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Need 2 units of O negative blood for my father, accident case, urgent" />
        <button type="button" onClick={analyze} disabled={busy} className="btn-navy mt-4">{busy && !x ? "Reading your request..." : x ? "Read again" : "Read my request"}</button>
      </div>

      {error && <div className="err mt-4" role="alert">{error}</div>}

      {x?.organ && (
        <div className="card mt-6 border-l-4 border-navy p-6">
          <h2 className="font-display text-xl font-semibold text-navy">Organ and tissue requests go through official channels</h2>
          <p className="mt-2 text-mute">Organ allocation in India is handled by NOTTO, ROTTO and SOTTO. CritiMatch cannot match these requests. Please contact the transplant coordinator at your hospital, who can register the patient with the right authority.</p>
        </div>
      )}

      {x && !x.organ && (
        <form onSubmit={submit} className="card mt-6 space-y-5 p-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-crimson-dark">Check the details</h2>
            {x.needsManualForm
              ? <p className="mt-1 text-sm text-crimson-dark">We were not fully sure what you meant. Please confirm each field below.</p>
              : <p className="mt-1 text-sm text-mute">This is what we understood. Change anything that is wrong.</p>}
            {x.urgencyPreview != null && <div className="mt-3 flex items-center gap-2 text-sm text-mute">Estimated urgency <UrgencyPill score={x.urgencyPreview} /></div>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="cat" className="label">Resource</label>
              <select id="cat" className="input" value={category} onChange={(e) => { const c = e.target.value as CategoryT; setCategory(c); setSubtype(SUBTYPES[c][0]); }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="sub" className="label">{category === "BLOOD" ? "Blood group" : "Type"}</label>
              <select id="sub" className="input" value={subtype} onChange={(e) => setSubtype(e.target.value)} required>
                {SUBTYPES[category].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="qty" className="label">Quantity</label>
              <input id="qty" type="number" min={1} max={50} className="input" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} />
            </div>
          </div>

          <div>
            <label htmlFor="area" className="label">Where is the patient?</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select id="area" className="input" value={areaIdx} disabled={!!coords} onChange={(e) => setAreaIdx(Number(e.target.value))}>
                {AREAS.map((a, i) => <option key={a.name} value={i}>{a.name}</option>)}
              </select>
              <button type="button" onClick={coords ? () => setCoords(null) : locate} className="btn-quiet shrink-0">{coords ? "Use a listed area" : "Use my location"}</button>
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="label">Phone number the facility can call</label>
            <input id="phone" type="tel" required minLength={8} className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" />
            <p className="mt-1 text-xs text-mute">Shared only with the facility that confirms your request.</p>
          </div>

          <button className="btn-primary w-full" disabled={busy || !phone}>{busy ? "Sending..." : "Send request"}</button>
        </form>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense><Form /></Suspense>;
}
