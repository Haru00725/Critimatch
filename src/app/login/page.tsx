"use client";
import Link from "next/link";
import { useState } from "react";
import { send } from "@/lib/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const r = await send<{ role: string }>("/api/auth/login", "POST", { email, password });
    if (!r.ok) { setBusy(false); return setError(r.data.error || "Could not sign in."); }
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next || (r.data.role === "ADMIN" ? "/admin" : "/facility");
  }

  return (
    <div className="mx-auto max-w-md px-5 py-14">
      <h1 className="font-display text-3xl font-semibold text-crimson-dark">Facility sign in</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label htmlFor="pw" className="label">Password</label><input id="pw" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <div className="err" role="alert">{error}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <p className="mt-4 text-sm text-mute">New facility? <Link href="/register" className="font-semibold text-navy underline">Register here</Link>.</p>
    </div>
  );
}
