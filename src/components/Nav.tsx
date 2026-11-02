"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Nav() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then((j) => setRole(j.role)).catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setRole(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-blush/70 bg-cream">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-2xl font-semibold text-crimson-dark">CritiMatch</Link>
        <div className="flex items-center gap-2 text-sm font-semibold sm:gap-5">
          <Link href="/request/new" className="rounded-lg px-3 py-2 text-crimson hover:bg-crimson-soft">Request help</Link>
          {role === "FACILITY" && <Link href="/facility" className="rounded-lg px-3 py-2 text-navy hover:bg-navy-soft">My facility</Link>}
          {role === "ADMIN" && <Link href="/admin" className="rounded-lg px-3 py-2 text-navy hover:bg-navy-soft">Admin</Link>}
          {role ? (
            <button onClick={logout} className="rounded-lg px-3 py-2 text-mute hover:bg-blush">Sign out</button>
          ) : (
            <Link href="/login" className="rounded-lg px-3 py-2 text-navy hover:bg-navy-soft">Facility sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
