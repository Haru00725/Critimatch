"use client";
import { fmtClock, useNow } from "@/lib/client";
import { urgencyLabel } from "@/lib/urgency";

export function UrgencyPill({ score }: { score: number }) {
  const tone = score >= 70 ? "bg-crimson text-white" : score >= 40 ? "bg-crimson-soft text-crimson-dark" : "bg-navy-soft text-navy";
  return <span className={`pill ${tone}`}>{urgencyLabel(score)} · {score}</span>;
}

export function Countdown({ until, label }: { until: string | Date; label?: string }) {
  const now = useNow();
  const left = new Date(until).getTime() - now;
  return <span className="tabular-nums">{label}{left > 0 ? fmtClock(left) : "00:00"}</span>;
}

/** The deck's 1-hour response window, drawn as a ring. */
export function SlaRing({ deadline, created, done }: { deadline: string; created: string; done?: boolean }) {
  const now = useNow();
  const total = new Date(deadline).getTime() - new Date(created).getTime();
  const left = Math.max(0, new Date(deadline).getTime() - now);
  const frac = done ? 1 : total > 0 ? left / total : 0;
  const R = 70, C = 2 * Math.PI * R;
  return (
    <div className="relative h-44 w-44 shrink-0" role="img" aria-label={done ? "Matched" : `Time left in response window ${fmtClock(left)}`}>
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={R} fill="none" stroke="#E8E1E1" strokeWidth="12" />
        <circle cx="80" cy="80" r={R} fill="none" stroke={done ? "#2D3A7C" : "#9A0012"} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-semibold tabular-nums text-crimson-dark">{done ? "Matched" : fmtClock(left)}</span>
        <span className="text-xs text-mute">{done ? "facility confirmed" : left > 0 ? "until escalation" : "escalating now"}</span>
      </div>
    </div>
  );
}
