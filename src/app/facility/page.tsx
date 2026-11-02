"use client";
import { useState } from "react";
import { CATEGORIES, CATEGORY_LABEL, SUBTYPES, type CategoryT } from "@/lib/constants";
import { send, usePoll } from "@/lib/client";
import { Countdown, UrgencyPill } from "@/components/ui";

type Item = { id: string; category: CategoryT; subtype: string; quantity: number };
type Inv = { items: Item[]; facility: { name: string; verified: boolean; area: string } };
type Offer = {
  id: string; distanceKm: number; offerExpiresAt: string;
  request: { category: CategoryT; subtype: string; quantity: number; urgencyScore: number; rawText: string; escalated: boolean; contactPhone: string | null };
};
type Offers = { open: Offer[]; confirmed: Offer[] };

const label = (c: CategoryT, s: string) => (c === "BLOOD" ? `${s} blood` : CATEGORY_LABEL[c]);

function Offers() {
  const { data, reload, error } = usePoll<Offers>("/api/facility/offers", 5000);
  const [msg, setMsg] = useState("");

  async function act(id: string, action: "confirm" | "decline") {
    setMsg("");
    const r = await send(`/api/matches/${id}/${action}`, "POST");
    if (!r.ok) setMsg(r.data.error || "Something went wrong.");
    reload();
  }

  return (
    <div className="space-y-6">
      {error && <div className="err">{error}</div>}
      {msg && <div className="err" role="alert">{msg}</div>}
      <section>
        <h2 className="font-display text-xl font-semibold text-crimson-dark">Open offers</h2>
        {!data?.open.length && <p className="card mt-3 p-6 text-mute">No requests for your stock right now. This page checks for new offers every few seconds.</p>}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {data?.open.map((o) => (
            <div key={o.id} className="card border-l-4 border-crimson p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold">{o.request.quantity} × {label(o.request.category, o.request.subtype)}</h3>
                <UrgencyPill score={o.request.urgencyScore} />
              </div>
              <p className="mt-2 text-sm text-mute">“{o.request.rawText}”</p>
              <p className="mt-2 text-sm text-mute">{o.distanceKm} km away{o.request.escalated ? " · escalated" : ""} · respond within <b className="text-crimson-dark"><Countdown until={o.offerExpiresAt} /></b></p>
              <div className="mt-4 flex gap-3">
                <button className="btn-primary flex-1" onClick={() => act(o.id, "confirm")}>Confirm and reserve</button>
                <button className="btn-quiet" onClick={() => act(o.id, "decline")}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-semibold text-navy">Confirmed requests</h2>
        {!data?.confirmed.length && <p className="mt-3 text-mute">Nothing confirmed yet.</p>}
        <div className="mt-3 space-y-3">
          {data?.confirmed.map((o) => (
            <div key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="font-semibold">{o.request.quantity} × {label(o.request.category, o.request.subtype)}</span>
              {o.request.contactPhone && <a className="btn-navy py-2" href={`tel:${o.request.contactPhone.replace(/\s/g, "")}`}>Call requester {o.request.contactPhone}</a>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Inventory() {
  const { data, reload, error } = usePoll<Inv>("/api/inventory", 15000);
  const [cat, setCat] = useState<CategoryT>("BLOOD");
  const [sub, setSub] = useState(SUBTYPES.BLOOD[0]);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  async function setQuantity(id: string, quantity: number) {
    const r = await send("/api/inventory", "PUT", { id, quantity: Math.max(0, quantity) });
    if (!r.ok) setMsg(r.data.error || "Could not update.");
    reload();
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const r = await send("/api/inventory", "POST", { category: cat, subtype: sub, quantity: qty });
    setMsg(r.ok ? "" : r.data.error || "Could not save.");
    reload();
  }
  async function remove(id: string) {
    await send(`/api/inventory?id=${id}`, "DELETE");
    reload();
  }

  return (
    <div className="space-y-6">
      {error && <div className="err">{error}</div>}
      {msg && <div className="err" role="alert">{msg}</div>}
      <form onSubmit={add} className="card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end">
        <div><label htmlFor="c" className="label">Resource</label>
          <select id="c" className="input" value={cat} onChange={(e) => { const c = e.target.value as CategoryT; setCat(c); setSub(SUBTYPES[c][0]); }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select></div>
        <div><label htmlFor="s" className="label">{cat === "BLOOD" ? "Blood group" : "Type"}</label>
          <select id="s" className="input" value={sub} onChange={(e) => setSub(e.target.value)}>{SUBTYPES[cat].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label htmlFor="q" className="label">In stock</label>
          <input id="q" type="number" min={0} className="input" value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} /></div>
        <button className="btn-navy">Save stock</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-blush text-sm text-mute"><tr><th className="p-4">Resource</th><th className="p-4">Type</th><th className="p-4">In stock</th><th className="p-4" /></tr></thead>
          <tbody>
            {data?.items.length === 0 && <tr><td colSpan={4} className="p-6 text-mute">No stock listed yet. Add your first item above so requests can be matched to you.</td></tr>}
            {data?.items.map((i) => (
              <tr key={i.id} className="border-b border-blush/60 last:border-0">
                <td className="p-4 font-semibold">{CATEGORY_LABEL[i.category]}</td>
                <td className="p-4">{i.subtype}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button aria-label="Decrease" className="btn-quiet h-9 w-9 p-0" onClick={() => setQuantity(i.id, i.quantity - 1)}>−</button>
                    <input aria-label="Quantity" type="number" min={0} defaultValue={i.quantity} key={i.quantity} className="input w-20 py-2 text-center"
                      onBlur={(e) => Number(e.target.value) !== i.quantity && setQuantity(i.id, Number(e.target.value))} />
                    <button aria-label="Increase" className="btn-quiet h-9 w-9 p-0" onClick={() => setQuantity(i.id, i.quantity + 1)}>+</button>
                    {i.quantity === 0 && <span className="pill bg-crimson-soft text-crimson-dark">Out of stock</span>}
                  </div>
                </td>
                <td className="p-4 text-right"><button className="text-sm font-semibold text-crimson hover:underline" onClick={() => remove(i.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function FacilityPage() {
  const [tab, setTab] = useState<"offers" | "inventory">("offers");
  const { data } = usePoll<Inv>("/api/inventory", 30000);
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold text-crimson-dark">{data?.facility.name ?? "Your facility"}</h1>
        {data && <span className={`pill ${data.facility.verified ? "bg-navy-soft text-navy" : "bg-crimson-soft text-crimson-dark"}`}>{data.facility.verified ? "Verified" : "Awaiting verification"}</span>}
      </div>
      {data && !data.facility.verified && <div className="err mt-4">Requests are only offered to verified facilities. An administrator will review your registration.</div>}
      <div className="mt-6 flex gap-2" role="tablist">
        {(["offers", "inventory"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-xl px-5 py-2.5 font-semibold ${tab === t ? "bg-navy text-white" : "bg-blush text-ink hover:bg-[#dcd2d2]"}`}>
            {t === "offers" ? "Offers" : "Inventory"}
          </button>
        ))}
      </div>
      <div className="mt-6">{tab === "offers" ? <Offers /> : <Inventory />}</div>
    </div>
  );
}
