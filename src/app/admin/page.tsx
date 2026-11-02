"use client";
import Link from "next/link";
import { CATEGORY_LABEL, FACILITY_TYPE_LABEL, STATUS_LABEL, type CategoryT } from "@/lib/constants";
import { send, usePoll } from "@/lib/client";
import { UrgencyPill } from "@/components/ui";

type Overview = {
  facilities: { id: string; name: string; type: string; area: string; phone: string; verified: boolean }[];
  alerts: { id: string; message: string; createdAt: string; request: { token: string; category: CategoryT; subtype: string; quantity: number; urgencyScore: number; contactPhone: string; status: string } }[];
  stats: Record<string, number>;
};

export default function Admin() {
  const { data, reload, error } = usePoll<Overview>("/api/admin/overview", 8000);

  async function verify(id: string, verified: boolean) { await send(`/api/admin/facilities/${id}/verify`, "POST", { verified }); reload(); }
  async function resolve(id: string) { await send(`/api/admin/alerts/${id}/resolve`, "POST"); reload(); }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-display text-3xl font-semibold text-crimson-dark">Admin console</h1>
      {error && <div className="err mt-4">{error}</div>}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {["PENDING", "OFFERED", "CONFIRMED", "ESCALATED", "CANCELLED"].map((s, i) => (
          <div key={s} className={`rounded-2xl p-4 ${i % 2 ? "bg-navy text-white" : "bg-crimson text-white"}`}>
            <div className="font-display text-3xl">{data?.stats[s] ?? 0}</div>
            <div className="text-xs opacity-90">{STATUS_LABEL[s]}</div>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-crimson-dark">Escalations</h2>
        {data && data.alerts.length === 0 && <p className="card mt-3 p-6 text-mute">No open escalations. Requests that pass the 1-hour window will appear here.</p>}
        <div className="mt-3 space-y-3">
          {data?.alerts.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center justify-between gap-3 border-l-4 border-crimson p-5">
              <div>
                <div className="flex items-center gap-3"><b>{a.request.quantity} × {a.request.subtype} {CATEGORY_LABEL[a.request.category].toLowerCase()}</b><UrgencyPill score={a.request.urgencyScore} /></div>
                <p className="mt-1 text-sm text-mute">{a.message} Requester: {a.request.contactPhone} · {STATUS_LABEL[a.request.status]}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/request/${a.request.token}`} className="btn-quiet py-2">View</Link>
                <button className="btn-navy py-2" onClick={() => resolve(a.id)}>Mark handled</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-navy">Facilities</h2>
        <div className="card mt-3 divide-y divide-blush/60">
          {data?.facilities.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-semibold">{f.name}</div>
                <div className="text-sm text-mute">{FACILITY_TYPE_LABEL[f.type]} · {f.area} · {f.phone}</div>
              </div>
              <button className={f.verified ? "btn-quiet py-2" : "btn-primary py-2"} onClick={() => verify(f.id, !f.verified)}>{f.verified ? "Remove verification" : "Verify facility"}</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
