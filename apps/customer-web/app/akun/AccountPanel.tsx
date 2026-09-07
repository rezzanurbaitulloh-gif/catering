"use client";

import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatIDR, formatTanggalID } from "@/lib/format";

interface AccountData {
  customer: { name: string };
  events: Array<{
    event_no: string; title: string; event_type: string; event_date: string;
    venue_text: string | null; status: string; payment_status: string;
    pax_confirmed: number; pax_final: number | null;
  }>;
  quotes: Array<{ id: string; quote_no: string; status: string; total: number }>;
}

// Akun pelanggan sederhana -> POST /api/account (identifikasi nomor WhatsApp).
export default function AccountPanel() {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found" | "failed">("idle");
  const [msg, setMsg] = useState("");
  const [data, setData] = useState<AccountData | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^(\+62|62|0)8[\d\s\-.()]{7,15}$/.test(phone.trim())) {
      setMsg("Nomor WhatsApp tidak valid.");
      setState("failed");
      return;
    }
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const body = (await res.json()) as AccountData & { error?: string };
      if (!res.ok) {
        setMsg(body.error ?? "Gagal memuat akun.");
        setState("failed");
        return;
      }
      setData(body);
      setState("found");
    } catch {
      setMsg("Jaringan bermasalah. Coba lagi.");
      setState("failed");
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
        <div className="flex-1">
          <label htmlFor="a-phone" className="label">Nomor WhatsApp terdaftar</label>
          <input id="a-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" inputMode="tel" autoComplete="tel" />
        </div>
        <button type="submit" className="btn-gold sm:self-end" disabled={state === "loading"}>
          {state === "loading" ? "Memuat…" : "Lihat Akun"}
        </button>
      </form>
      {state === "failed" ? <p className="error-text mt-3" role="alert">{msg}</p> : null}
      {state === "found" && data ? (
        <div className="mt-6 space-y-6" role="status">
          <h2 className="font-display text-2xl font-bold">Halo, {data.customer.name}</h2>
          <section aria-labelledby="akun-acara">
            <h3 id="akun-acara" className="font-display text-lg font-bold">Acara Anda ({data.events.length})</h3>
            {data.events.length ? (
              <ul className="mt-2 space-y-2">
                {data.events.map((ev) => (
                  <li key={ev.event_no} className="rounded-brand border border-line bg-white p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong>{ev.title}</strong>
                      <StatusBadge status={ev.status} />
                      <StatusBadge status={ev.payment_status} />
                    </div>
                    <p className="mt-1 text-muted">{ev.event_no} · {ev.event_type} · {formatTanggalID(ev.event_date)}</p>
                    <p className="mt-1">Tamu: <strong>{ev.pax_final ?? ev.pax_confirmed} pax</strong></p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">Belum ada acara. <Link href="/booking" className="font-bold text-gold-deep underline">Buat permintaan</Link></p>}
          </section>
          <section aria-labelledby="akun-q">
            <h3 id="akun-q" className="font-display text-lg font-bold">Penawaran ({data.quotes.length})</h3>
            {data.quotes.length ? (
              <ul className="mt-2 space-y-2">
                {data.quotes.map((qt) => (
                  <li key={qt.id} className="flex items-center justify-between gap-3 rounded-brand border border-line bg-white p-4 text-sm">
                    <span><strong>{qt.quote_no}</strong> · {formatIDR(qt.total)} <StatusBadge status={qt.status} /></span>
                    <Link href={`/penawaran/${qt.id}`} className="font-bold text-gold-deep underline">Tinjau</Link>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">Belum ada penawaran.</p>}
          </section>
        </div>
      ) : null}
    </div>
  );
}
