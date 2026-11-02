"use client";
import { CATEGORY_LABEL, STATUS_LABEL, type CategoryT } from "@/lib/constants";
import { usePoll } from "@/lib/client";
import { SlaRing, UrgencyPill } from "@/components/ui";

type Data = {
  status: string; category: CategoryT; subtype: string; quantity: number; urgencyScore: number;
  llmUrgency: number | null; keywordScore: number; radiusKm: number; createdAt: string; deadlineAt: string; escalatedAt: string | null;
  attempts: number; current: { facility: string; distanceKm: number } | null;
  facility: { name: string; phone: string; area: string; lat: number; lng: number; distanceKm: number } | null;
};

export default function Track({ params }: { params: { token: string } }) {
  const { data, error } = usePoll<Data>(`/api/requests/${params.token}`, 5000);

  if (error && !data) return <div className="mx-auto max-w-2xl px-5 py-12"><div className="err">{error}</div></div>;
  if (!data) return <div className="mx-auto max-w-2xl px-5 py-12 text-mute">Loading your request...</div>;

  const done = data.status === "CONFIRMED";
  const steps = [
    { label: "Request received", on: true },
    { label: data.current ? `Offer sent to ${data.current.facility} (${data.current.distanceKm} km)` : "Offer sent to a facility", on: data.status !== "PENDING" || data.attempts > 0 },
    { label: "Facility confirmed", on: done },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-crimson-dark">{STATUS_LABEL[data.status]}</h1>
      <p className="mt-2 text-mute">
        {data.quantity} × {data.subtype !== "Cylinder" && data.subtype !== "ICU" && data.subtype !== "Standard" ? `${data.subtype} ` : ""}
        {CATEGORY_LABEL[data.category].toLowerCase()}. Bookmark this page to check back. It updates every few seconds.
      </p>

      <div className="card mt-6 flex flex-col items-center gap-8 p-7 sm:flex-row">
        <SlaRing deadline={data.deadlineAt} created={data.createdAt} done={done} />
        <ol className="w-full space-y-4">
          {steps.map((s) => (
            <li key={s.label} className="flex items-start gap-3">
              <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${s.on ? "border-navy bg-navy" : "border-blush bg-white"}`} />
              <span className={s.on ? "font-semibold text-ink" : "text-mute"}>{s.label}</span>
            </li>
          ))}
        </ol>
      </div>

      {data.status === "ESCALATED" && (
        <div className="err mt-4">This request passed the 1-hour window. We widened the search to {data.radiusKm} km and alerted an administrator.</div>
      )}
      {data.status === "PENDING" && (
        <div className="card mt-4 p-5 text-mute">No verified facility within {data.radiusKm} km has this in stock right now. We keep checking and will offer it the moment stock appears.</div>
      )}

      {data.facility && (
        <div className="card mt-6 border-l-4 border-navy p-6">
          <h2 className="font-display text-xl font-semibold text-navy">Go to {data.facility.name}</h2>
          <p className="mt-1 text-mute">{data.facility.area} · {data.facility.distanceKm} km away</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="btn-primary" href={`tel:${data.facility.phone.replace(/\s/g, "")}`}>Call {data.facility.phone}</a>
            <a className="btn-quiet" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${data.facility.lat}&mlon=${data.facility.lng}#map=16/${data.facility.lat}/${data.facility.lng}`}>Open on map</a>
          </div>
          <p className="mt-3 text-sm text-mute">The facility has reserved your units. Call before you travel and carry the patient&apos;s documents.</p>
        </div>
      )}

      <div className="card mt-6 p-6">
        <h2 className="font-semibold">How the urgency score was set</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-mute">
          <UrgencyPill score={data.urgencyScore} />
          <span>AI estimate: {data.llmUrgency ?? "not used"}</span>
          <span>Keyword severity: {data.keywordScore}</span>
          <span>Search radius: {data.radiusKm} km</span>
        </div>
      </div>
    </div>
  );
}
