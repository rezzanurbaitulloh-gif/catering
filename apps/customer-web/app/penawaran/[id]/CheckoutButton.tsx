"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

// Checkout final (WAJIB login): quote APPROVED milik sendiri → event + booking.
// Server memvalidasi kepemilikan dari sesi; tombol ini hanya pemicu.
export default function CheckoutButton({ quoteId, approved }: { quoteId: string; approved: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");
  const [msg, setMsg] = useState("");
  const [eventNo, setEventNo] = useState("");

  async function checkout() {
    setState("busy");
    setMsg("");
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error("Layanan belum terkonfigurasi.");
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMsg("Masuk dulu sebelum checkout.");
        setState("failed");
        return;
      }
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quote_id: quoteId }),
      });
      const body = (await res.json()) as { error?: string; event_id?: string; event_no?: string; reused?: boolean };
      if (!res.ok) {
        setMsg(body.error ?? "Checkout gagal.");
        setState("failed");
        return;
      }
      setEventNo(body.event_no ?? "");
      setState("done");
    } catch {
      setMsg("Jaringan bermasalah. Coba lagi.");
      setState("failed");
    }
  }

  if (!approved) return null;

  if (state === "done") {
    return (
      <div className="rounded-brand border border-[#15803D]/40 bg-[#15803D]/5 p-4 text-sm" role="status">
        <p className="font-bold text-[#15803D]">Pesanan dibuat ✓ {eventNo}</p>
        <p className="mt-2 flex gap-3">
          <Link href="/akun" className="font-bold text-gold-deep underline">Buka Dashboard</Link>
          <Link href="/lacak" className="font-bold text-gold-deep underline">Lacak</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={checkout} disabled={state === "busy"} className="btn-primary w-full">
        {state === "busy" ? "Membuat pesanan…" : "Buat Pesanan (Checkout)"}
      </button>
      {state === "failed" && msg ? (
        <p className="mt-2 text-sm" role="alert">
          {msg}{" "}
          {msg.includes("Masuk") ? <Link href="/masuk" className="font-bold text-gold-deep underline">Masuk</Link> : null}
        </p>
      ) : null}
      <p className="mt-1 text-xs text-muted">Checkout wajib login — pesanan terikat ke akun Anda.</p>
    </div>
  );
}
