"use client";

import { useCallback, useEffect, useState } from "react";
import { BUSINESS_ID } from "@/lib/constants";
import { supabaseBrowser } from "@/lib/supabase-browser";

// 32 kapabilitas premium (cermin packages/config + admin-web/lib/capabilities).
const PREMIUM = [
  "crm", "advanced_quotation", "quotation_versioning", "quote_approval",
  "change_request", "customer_accounts", "online_payment", "dynamic_pricing",
  "promotions", "coupons", "production_planning", "recipe_bom", "inventory",
  "procurement", "suppliers", "workforce_management", "vehicle_management",
  "equipment_tracking", "resource_capacity", "venue_management",
  "transport_management", "advanced_event_control", "risk_engine",
  "advanced_incident_management", "advanced_finance", "costing",
  "profitability", "advanced_analytics", "exports", "offline_sync",
  "qr_scanning", "digital_handover",
];

type Mode = "PREMIUM" | "BASIC" | "CUSTOM";

function detect(caps: Array<{ capability: string; enabled: boolean }>): Mode {
  const on = new Set(caps.filter((c) => c.enabled).map((c) => c.capability));
  const n = PREMIUM.filter((c) => on.has(c)).length;
  if (n === 0) return "BASIC";
  if (n === PREMIUM.length) return "PREMIUM";
  return "CUSTOM";
}

// Toggle mode PUBLIK di header: siapa pun boleh ubah (keputusan pemilik),
// perubahan tersiar realtime ke semua web yang terbuka (customer + admin).
export default function ModeToggle() {
  const [caps, setCaps] = useState<Array<{ capability: string; enabled: boolean }>>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data } = await sb
      .from("business_capabilities")
      .select("capability,enabled")
      .eq("business_id", BUSINESS_ID);
    setCaps((data ?? []) as Array<{ capability: string; enabled: boolean }>);
  }, []);

  useEffect(() => {
    load();
    const sb = supabaseBrowser();
    if (!sb) return;
    // Dengarkan perubahan mode dari web mana pun → ikut berubah tanpa refresh.
    const ch = sb
      .channel("mode-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "business_capabilities", filter: `business_id=eq.${BUSINESS_ID}` },
        () => load()
      )
      .subscribe();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      sb.removeChannel(ch);
    };
  }, [load]);

  async function setMode(premium: boolean) {
    const sb = supabaseBrowser();
    if (!sb) return;
    setBusy(true);
    try {
      for (const cap of PREMIUM) {
        const { error } = await sb
          .from("business_capabilities")
          .update({ enabled: premium })
          .eq("business_id", BUSINESS_ID)
          .eq("capability", cap);
        if (error) throw error;
      }
      await load();
      setOpen(false);
    } catch {
      await load();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (caps.length === 0) return null;
  const mode = detect(caps);
  const label = mode === "PREMIUM" ? "✦ Premium" : mode === "BASIC" ? "Basic" : "Custom";
  const premium = mode === "PREMIUM";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Ubah mode layanan (berlaku di semua web)"
        aria-expanded={open}
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
          premium ? "border-gold/50 bg-gold-soft text-gold-deep" : "border-line bg-white text-muted"
        }`}
      >
        {label} ▾
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-brand border border-line bg-white p-2 shadow-lg" role="menu">
          <p className="px-2 pt-1 text-xs text-muted">Mode layanan — berubah di customer &amp; admin sekaligus.</p>
          <button type="button" disabled={busy} onClick={() => setMode(false)}
            className="mt-1 w-full rounded-lg px-3 py-2.5 text-left hover:bg-cream disabled:opacity-60" role="menuitem">
            <span className="block text-sm font-bold">Basic {mode === "BASIC" ? "✓" : ""}</span>
            <span className="block text-xs text-muted">Paket, booking, lacak.</span>
          </button>
          <button type="button" disabled={busy} onClick={() => setMode(true)}
            className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-cream disabled:opacity-60" role="menuitem">
            <span className="block text-sm font-bold">✦ Premium {premium ? "✓" : ""}</span>
            <span className="block text-xs text-muted">Penawaran daring, akun, bayar online.</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
