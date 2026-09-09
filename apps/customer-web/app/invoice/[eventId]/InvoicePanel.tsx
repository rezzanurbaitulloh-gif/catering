"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { useCustomerAuth } from "@/lib/auth";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { formatIDR, formatTanggalID, formatTanggalPendek } from "@/lib/format";

interface Invoice {
  invoice_no: string; issued_at: string;
  business: { name: string };
  customer: { name: string; phone: string; email: string | null; address: string | null };
  event: { event_no: string; title: string; event_type: string; event_date: string; venue: string | null; pax: number; status: string; payment_status: string };
  quote_no: string | null;
  version: { version: number; pax: number; items: Array<{ name: string; qty: number; unit_price: number; per_pax?: boolean }>; subtotal: number; discount: number; total: number; created_at: string } | null;
  subtotal: number; discount: number; total: number; paid: number; outstanding: number;
  payments: Array<{ amount: number; method: string; kind: string; status: string; received_at: string | null; reference: string | null }>;
  verify_url: string; qr: string;
}

// Invoice: dihitung dari versi quotation terkunci + riwayat pembayaran.
// Tombol cetak memakai gaya print (navigasi disembunyikan saat mencetak).
export default function InvoicePanel({ eventId }: { eventId: string }) {
  const { user } = useCustomerAuth();
  const [inv, setInv] = useState<Invoice | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const sb = supabaseBrowser();
        if (!sb) throw new Error("Layanan belum terkonfigurasi.");
        const { data } = await sb.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setErr("Masuk dulu untuk melihat invoice.");
          return;
        }
        const res = await fetch(`/api/invoice/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = (await res.json()) as Invoice & { error?: string };
        if (!res.ok) throw new Error(body.error ?? "Gagal memuat invoice.");
        setInv(body);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Gagal memuat invoice.");
      }
    })();
  }, [eventId, user]);

  if (err) {
    return (
      <div className="text-sm">
        <p className="error-text" role="alert">{err}</p>
        <p className="mt-3"><Link href="/masuk" className="btn-gold">Masuk</Link></p>
      </div>
    );
  }
  if (!inv) return <p className="text-sm text-muted">Memuat invoice…</p>;

  return (
    <div>
      <div className="print-hide mb-4 flex gap-2">
        <button type="button" onClick={() => window.print()} className="btn-gold">Cetak / Simpan PDF</button>
        <Link href="/akun" className="btn-outline">Kembali</Link>
      </div>
      <article className="invoice-sheet rounded-brand border border-line bg-white p-6 text-sm" aria-label={`Invoice ${inv.invoice_no}`}>
        <header className="flex flex-wrap justify-between gap-3 border-b-2 border-ink pb-4">
          <div>
            <p className="font-display text-2xl font-bold">{inv.business.name}</p>
            <p className="text-muted">Jl. A. Yani No. 88, Nganjuk · (0358) 321-456</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold">INVOICE</p>
            <p className="font-mono font-bold">{inv.invoice_no}</p>
            <p className="text-muted">Terbit {formatTanggalID(inv.issued_at)}</p>
          </div>
        </header>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="font-bold">Ditagihkan kepada</p>
            <p>{inv.customer.name}</p>
            <p className="text-muted">{inv.customer.phone}{inv.customer.email ? ` · ${inv.customer.email}` : ""}</p>
            {inv.customer.address ? <p className="text-muted">{inv.customer.address}</p> : null}
          </div>
          <div>
            <p className="font-bold">Acara</p>
            <p>{inv.event.title} ({inv.event.event_no})</p>
            <p className="text-muted">{inv.event.event_type} · {formatTanggalID(inv.event.event_date)} · {inv.event.pax} pax</p>
            {inv.event.venue ? <p className="text-muted">{inv.event.venue}</p> : null}
            {inv.quote_no ? <p className="text-muted">Ref penawaran {inv.quote_no}{inv.version ? ` v${inv.version.version}` : ""}</p> : null}
          </div>
        </div>
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="py-2 pr-2">Item</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 pr-2 text-right">Harga</th>
              <th className="py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {(inv.version?.items ?? []).map((it, i) => {
              const qty = it.per_pax === false ? it.qty : it.qty * (inv.version?.pax ?? 0);
              return (
                <tr key={i} className="border-b border-line/60">
                  <td className="py-2 pr-2">{it.name}{it.per_pax === false ? "" : " /pax"}</td>
                  <td className="py-2 pr-2 text-right">{qty}</td>
                  <td className="py-2 pr-2 text-right">{formatIDR(it.unit_price)}</td>
                  <td className="py-2 text-right">{formatIDR(qty * it.unit_price)}</td>
                </tr>
              );
            })}
            {!(inv.version?.items?.length) ? (
              <tr><td colSpan={4} className="py-3 text-center text-muted">Rincian menyusul dari admin.</td></tr>
            ) : null}
          </tbody>
        </table>
        <dl className="ml-auto mt-3 w-64 space-y-1">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatIDR(inv.subtotal)}</dd></div>
          {inv.discount ? <div className="flex justify-between"><dt className="text-muted">Diskon</dt><dd>−{formatIDR(inv.discount)}</dd></div> : null}
          <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatIDR(inv.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Dibayar</dt><dd className="text-[#15803D]">{formatIDR(inv.paid)}</dd></div>
          <div className="flex justify-between font-bold"><dt>Sisa</dt><dd className={inv.outstanding ? "text-[#B91C1C]" : ""}>{formatIDR(inv.outstanding)}</dd></div>
        </dl>
        <div className="mt-4 border-t border-line pt-3">
          <p className="font-bold">Riwayat pembayaran</p>
          {inv.payments.length === 0 ? <p className="text-muted">Belum ada pembayaran tercatat.</p> : (
            <ul className="mt-1 space-y-1">
              {inv.payments.map((p, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{p.kind} · {p.method}{p.received_at ? ` · ${formatTanggalPendek(p.received_at)}` : ""}</span>
                  <span><strong>{formatIDR(p.amount)}</strong> <StatusBadge status={p.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
          <p className="text-xs text-muted">Dokumen dihitung dari penawaran terkunci &amp; riwayat kas. Verifikasi: {inv.verify_url}</p>
          {inv.qr ? <img src={inv.qr} alt="QR verifikasi invoice" width={96} height={96} /> : null}
        </footer>
      </article>
    </div>
  );
}
