"use client";

import { useEffect, useState } from "react";

// Badge mode produk di header publik — TAMPIL SAJA (read-only).
// Toggle konfigurasi hanya ada di Admin Web (butuh login) agar pengunjung
// tidak bisa mengubah mode bisnis.
const PREMIUM_PROBE = ["advanced_event_control", "risk_engine", "profitability"];

export default function ModeBadge() {
  const [mode, setMode] = useState<"PREMIUM" | "BASIC" | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/capabilities", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { capabilities?: string[]; limited?: boolean };
        if (!alive || data.limited) return;
        const list = data.capabilities ?? [];
        setMode(list.some((c) => PREMIUM_PROBE.includes(c)) ? "PREMIUM" : "BASIC");
      } catch {
        /* offline — sembunyikan badge daripada tampil salah */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!mode) return null;
  const premium = mode === "PREMIUM";
  return (
    <span
      title={premium ? "Layanan lengkap: tracking, penawaran daring, akun" : "Layanan dasar"}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
        premium ? "border-gold/50 bg-gold-soft text-gold-deep" : "border-line bg-white text-muted"
      }`}
    >
      {premium ? "✦ Premium" : "Basic"}
    </span>
  );
}
