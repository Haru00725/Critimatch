"use client";
import Link from "next/link";
import { useState } from "react";
import { AREAS, FACILITY_TYPES, FACILITY_TYPE_LABEL } from "@/lib/constants";
import { send } from "@/lib/client";

export default function Register() {
  const [f, setF] = useState({ name: "", type: "HOSPITAL", areaIdx: 0, phone: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: k === "areaIdx" ? Number(e.target.value) : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const a = AREAS[f.areaIdx];
    const r = await send("/api/auth/register", "POST", { name: f.name, type: f.type, area: a.name, lat: a.lat, lng: a.lng, phone: f.phone, email: f.email, password: f.password });
    setBusy(false);
    if (!r.ok) return setError(r.data.error || "Could not register.");
    setDone(true);
  }

  if (done) return (
    <div className="mx-auto max-w-md px-5 py-14">
      <div className="card p-7">
        <h1 className="font-display text-2xl font-semibold text-navy">Registration received</h1>
        <p className="mt-2 text-mute">An administrator will verify your facility. You can sign in and add stock now, but requests are only offered to verified facilities.</p>
        <Link href="/login" className="btn-navy mt-5">Go to sign in</Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <h1 className="font-display text-3xl font-semibold text-crimson-dark">Register your facility</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <div><label htmlFor="name" className="label">Facility name</label><input id="name" required className="input" value={f.name} onChange={set("name")} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="type" className="label">Type</label>
            <select id="type" className="input" value={f.type} onChange={set("type")}>{FACILITY_TYPES.map((t) => <option key={t} value={t}>{FACILITY_TYPE_LABEL[t]}</option>)}</select></div>
          <div><label htmlFor="area" className="label">Area</label>
            <select id="area" className="input" value={f.areaIdx} onChange={set("areaIdx")}>{AREAS.map((a, i) => <option key={a.name} value={i}>{a.name}</option>)}</select></div>
        </div>
        <div><label htmlFor="phone" className="label">Phone for requesters</label><input id="phone" type="tel" required className="input" value={f.phone} onChange={set("phone")} /></div>
        <div><label htmlFor="email" className="label">Login email</label><input id="email" type="email" required className="input" value={f.email} onChange={set("email")} /></div>
        <div><label htmlFor="pw" className="label">Password (8+ characters)</label><input id="pw" type="password" required minLength={8} className="input" value={f.password} onChange={set("password")} /></div>
        {error && <div className="err" role="alert">{error}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Registering..." : "Register facility"}</button>
      </form>
    </div>
  );
}
