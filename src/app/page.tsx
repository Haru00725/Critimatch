"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  { t: "Facility updates", d: "Hospitals and blood banks list live stock: blood units, oxygen, ICU beds." },
  { t: "Request raised", d: "The requester describes the need in plain language. AI extracts the details." },
  { t: "Smart matching", d: "The system ranks facilities by urgency, availability and proximity." },
  { t: "Tracked to resolution", d: "Status updates live. Unmatched requests escalate automatically within 1 hour." },
];

const FEATURES = [
  ["Live facility inventory", "Hospitals, blood banks and pharmacies keep stock updated in real time."],
  ["AI-based request triage", "Free-text requests are parsed into structured, matchable fields."],
  ["Smart urgency scoring", "Hybrid AI and rule-based scoring ranks requests by true criticality."],
  ["Automated matching", "Requests go to facilities with enough available inventory, nearest first."],
  ["1-hour response window", "Unmatched requests escalate to a wider search and an admin alert."],
  ["Live status tracking", "Requesters and facilities both see the status change as it happens."],
];

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/request/new${text.trim() ? `?text=${encodeURIComponent(text.trim())}` : ""}`);
  }

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-crimson-dark sm:text-5xl">
            Find blood, oxygen and ICU beds in minutes, not phone calls.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">
            Hospitals, blood banks and pharmacies share live stock. You describe the emergency in your own words, and CritiMatch finds the nearest facility that has what you need.
          </p>
        </div>
        <form onSubmit={go} className="card p-6">
          <label htmlFor="need" className="label text-base">What do you need?</label>
          <textarea
            id="need" rows={4} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="My mother needs 2 units of O-negative blood urgently after an accident"
            className="input resize-none"
          />
          <button className="btn-primary mt-4 w-full" type="submit">Find a facility</button>
          <p className="mt-3 text-sm text-mute">No account needed. You will get a link to track the request.</p>
        </form>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="font-display text-3xl font-semibold text-crimson-dark">The problem</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="card p-7 text-xl leading-relaxed">
            During medical emergencies, families struggle to locate blood units, oxygen cylinders or ICU beds in time, because hospitals, blood banks and pharmacies have no shared platform to display live inventory.
          </div>
          <div className="grid gap-4">
            {[["0", "Shared visibility across facilities today"], ["N", "Phone calls a family makes during an emergency"], ["?", "Guaranteed response time on a request"]].map(([big, small]) => (
              <div key={big} className="flex items-center gap-5 rounded-2xl bg-crimson px-6 py-5 text-white">
                <span className="font-display text-4xl">{big}</span>
                <span className="text-sm">{small}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="font-display text-3xl font-semibold text-crimson-dark">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="card p-6">
              <span className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-white ${i % 2 ? "bg-navy" : "bg-crimson"}`}>{i + 1}</span>
              <h3 className="mt-4 text-lg font-semibold text-crimson-dark">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="font-display text-3xl font-semibold text-crimson-dark">Key features</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([t, d], i) => (
            <div key={t} className="card flex gap-4 p-6">
              <span className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${i % 2 ? "bg-navy" : "bg-crimson"}`} />
              <div>
                <h3 className="font-semibold text-ink">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mute">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-navy p-8 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold">Run a hospital, blood bank or pharmacy?</h2>
            <p className="mt-1 text-white/80">Register your facility, list your stock and receive matched requests.</p>
          </div>
          <Link href="/register" className="btn bg-white text-navy hover:bg-navy-soft">Register your facility</Link>
        </div>
      </section>
    </>
  );
}
