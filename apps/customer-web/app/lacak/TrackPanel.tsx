"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { EVENT_LIFECYCLE, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { formatIDR, formatTanggalID, formatTanggalPendek } from "@/lib/format";

interface TrackResult {
  event: {
    event_no: string;
    title: string;
    event_type: string;
    event_date: string;
    start_at: string | null;
    venue: string;
    status: string;
    payment_status: string;
    pax: { estimated: number; quoted: number; confirmed: number; final: number | null; locked: boolean };
    dietary: { vegetarian: number; vegan: number; allergies: string[]; notes: string | null };
    special_instructions: string | null;
  };
  payments: Array<{ amount: number; method: string; kind: string; status: string; received_at: string | null; reference: string | null }>;
  paidTotal: number;
  timelines: Array<{ label: string; planned_at: string; done_at: string | null; owner: string | null }>;
}

// Panel pelacakan -> GET /api/track?no=&phone= . Hanya data milik pemesan yang tampil.
export default function TrackPanel({ initialNo = "" }: { initialNo?: string }) {
  const [no, setNo] = useState(initialNo);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "loading" | "found" | "failed">("idle");
  const [failMsg, setFailMsg] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (no.trim().length < 3) errs.no = "Nomor acara wajib diisi.";
    if (!/^(\+62|62|0)8[\d\s\-.()]{7,15}$/.test(phone.trim())) errs.phone = "Nomor WhatsApp tidak valid.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState("loading");
    setFailMsg("");
    setResult(null);
    try {
      const res = await fetch(`/api/track?no=${encodeURIComponent(no.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const data = (await res.json()) as TrackResult & { error?: string };
      if (!res.ok) {
        setFailMsg(data.error ?? "Data tidak ditemukan.");
        setState("failed");
        return;
      }
      setResult(data);
      setState("found");
    } catch {
      setFailMsg("Jaringan bermasalah. Periksa koneksi lalu coba lagi.");
      setState("failed");
    }
  }

  const currentIdx = result ? EVENT_LIFECYCLE.findIndex((s) => s.status === result.event.status) : -1;

  return (
    <div>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
        <div>
          <label htmlFor="t-no" className="label">Nomor acara</label>
          <input id="t-no" className="field font-mono" value={no} onChange={(e) => setNo(e.target.value)} placeholder="EVENT-2026-001" autoComplete="off" aria-invalid={Boolean(errors.no)} />
          {errors.no ? <p className="error-text" role="alert">{errors.no}</p> : null}
        </div>
        <div>
          <label htmlFor="t-phone" className="label">Nomor WhatsApp pemesan</label>
          <input id="t-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
          {errors.phone ? <p className="error-text" role="alert">{errors.phone}</p> : null}
        </div>
        <button type="submit" className="btn-gold sm:w-auto" disabled={state === "loading"}>
          {state === "loading" ? "Mencari…" : "Lacak"}
        </button>
      </form>

      {state === "failed" ? (
        <p className="mt-4 rounded-brand border border-[#B91C1C]/40 bg-[#B91C1C]/5 p-3 text-sm font-medium text-[#B91C1C]" role="alert">{failMsg}</p>
      ) : null}

      {state === "found" && result ? (
        <div className="mt-6 space-y-6" role="status" aria-live="polite">
          <section aria-labelledby="ringkas">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="ringkas" className="font-display text-2xl font-bold">{result.event.title}</h2>
              <StatusBadge status={result.event.status} />
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Nomor acara</dt><dd className="font-mono font-bold">{result.event.event_no}</dd></div>
              <div><dt className="text-muted">Tanggal</dt><dd className="font-bold">{formatTanggalID(result.event.event_date)}</dd></div>
              <div><dt className="text-muted">Lokasi</dt><dd>{result.event.venue}</dd></div>
              <div><dt className="text-muted">Tamu (konfirmasi/final)</dt><dd><strong>{result.event.pax.final ?? result.event.pax.confirmed}</strong> pax{result.event.pax.locked ? " · terkunci" : ""}</dd></div>
            </dl>
            {result.event.special_instructions ? (
              <p className="mt-2 text-sm text-ink/70"><strong>Catatan acara:</strong> {result.event.special_instructions}</p>
            ) : null}
          </section>

          <section aria-labelledby="linimasa">
            <h3 id="linimasa" className="font-display text-xl font-bold">Linimasa status</h3>
            <ol className="mt-3 space-y-0">
              {EVENT_LIFECYCLE.map((s, i) => {
                const done = currentIdx >= 0 && i < currentIdx;
                const now = i === currentIdx;
                return (
                  <li key={s.status} className="flex gap-3" aria-current={now ? "step" : undefined}>
                    <div className="flex flex-col items-center" aria-hidden="true">
                      <span className={`mt-1.5 h-3.5 w-3.5 rounded-full border-2 ${now ? "border-gold bg-gold" : done ? "border-leaf bg-leaf" : "border-line bg-white"}`} />
                      {i < EVENT_LIFECYCLE.length - 1 ? <span className="w-0.5 flex-1 bg-line" /> : null}
                    </div>
                    <p className={`pb-4 text-sm ${now ? "font-bold text-gold-deep" : done ? "text-ink/80" : "text-muted"}`}>
                      {s.label}{now ? " — posisi saat ini" : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
            {result.timelines.length ? (
              <ul className="mt-1 space-y-1.5 text-sm">
                {result.timelines.map((t, i) => (
                  <li key={i} className="flex justify-between gap-3 border-b border-line pb-1.5 last:border-0">
                    <span>{t.label}{t.owner ? ` · ${t.owner}` : ""}{t.done_at ? " ✓" : ""}</span>
                    <span className="shrink-0 text-muted">{formatTanggalPendek(t.planned_at)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section aria-labelledby="bayar">
            <h3 id="bayar" className="font-display text-xl font-bold">Pembayaran</h3>
            <p className="mt-1 text-sm">
              Status: <strong>{PAYMENT_STATUS_LABEL[result.event.payment_status] ?? result.event.payment_status}</strong>
              {" · "}Masuk: <strong className="text-leaf">{formatIDR(result.paidTotal)}</strong>
            </p>
            {result.payments.length ? (
              <ul className="mt-2 divide-y divide-line rounded-brand border border-line bg-white">
                {result.payments.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span>{p.kind} · {p.method}{p.reference ? ` · ${p.reference}` : ""}</span>
                    <span className="text-right"><strong>{formatIDR(p.amount)}</strong><br /><span className="text-xs text-muted">{p.status}{p.received_at ? ` · ${formatTanggalPendek(p.received_at)}` : ""}</span></span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink/70">Belum ada pembayaran tercatat. Info transfer tersedia di footer &amp; halaman kontak.</p>
            )}
          </section>

          <section aria-labelledby="menu-pax">
            <h3 id="menu-pax" className="font-display text-xl font-bold">Menu &amp; tamu</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>Estimasi: {result.event.pax.estimated} · Penawaran: {result.event.pax.quoted} · Konfirmasi: {result.event.pax.confirmed}{result.event.pax.final != null ? ` · Final: ${result.event.pax.final}` : ""}</li>
              <li>Vegetarian: {result.event.dietary.vegetarian} · Vegan: {result.event.dietary.vegan}</li>
              {result.event.dietary.allergies.length ? <li>Alergi: {result.event.dietary.allergies.join(", ")}</li> : null}
              {result.event.dietary.notes ? <li>Catatan diet: {result.event.dietary.notes}</li> : null}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
