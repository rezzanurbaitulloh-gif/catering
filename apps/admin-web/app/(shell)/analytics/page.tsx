'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { rp } from '@/lib/format';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, Stat, Loading, ErrorState, LoginRequired } from '@/components/ui';

interface M {
  leads: number; inquiries: number; quotes: number; bookings: number;
  revenue: number; paid: number; eventsDone: number; incidents: number; complaints: number;
  onTime: string; avgOrder: number;
  monthly: Array<{ label: string; total: number }>;
  byType: Array<{ type: string; count: number }>;
}

// Analytics dihitung dari tabel nyata — tanpa angka palsu.
function An() {
  const { businessId, isDemo } = useBusiness();
  const [m, setM] = useState<M | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const sb = supabaseBrowser();
      const b = businessId;
      const [leads, iq, quotes, bookings, pays, evs, inc, comp, tl] = await Promise.all([
        sb.from('leads').select('id', { count: 'exact', head: true }).eq('business_id', b),
        sb.from('inquiries').select('id', { count: 'exact', head: true }).eq('business_id', b),
        sb.from('quotes').select('total,status').eq('business_id', b),
        sb.from('bookings').select('id', { count: 'exact', head: true }).eq('business_id', b),
        sb.from('payments').select('amount,status,received_at,created_at').eq('business_id', b),
        sb.from('events').select('id,status').eq('business_id', b),
        sb.from('incidents').select('id', { count: 'exact', head: true }).eq('business_id', b),
        sb.from('complaints').select('id', { count: 'exact', head: true }).eq('business_id', b),
        sb.from('event_timelines').select('done_at,planned_at').limit(200),
      ]);
      const qRows = (quotes.data ?? []) as unknown as Array<{ total: number; status: string }>;
      const payRows = (pays.data ?? []) as unknown as Array<{ amount: number; status: string; received_at: string | null; created_at?: string }>;
      // Kas masuk per bulan (6 bulan terakhir, dari pembayaran PAID nyata).
      const monthlyMap = new Map<string, number>();
      for (const p of payRows) {
        if (p.status !== 'PAID') continue;
        const d = new Date((p.received_at ?? (p as { created_at?: string }).created_at) ?? Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + p.amount);
      }
      const months: Array<{ label: string; total: number }> = [];
      const nowD = new Date();
      const idMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(nowD.getFullYear(), nowD.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        months.push({ label: idMonth[d.getMonth()], total: monthlyMap.get(key) ?? 0 });
      }
      // Donat tipe acara (hitung event nyata).
      const { data: evTypeRows } = await sb.from('events').select('event_type').eq('business_id', b);
      const typeMap = new Map<string, number>();
      for (const e of ((evTypeRows ?? []) as unknown as Array<{ event_type: string }>)) {
        typeMap.set(e.event_type, (typeMap.get(e.event_type) ?? 0) + 1);
      }
      const revenue = qRows.filter((q) => q.status === 'APPROVED').reduce((a, q) => a + q.total, 0);
      const paid = payRows.filter((p) => p.status === 'PAID').reduce((a, p) => a + p.amount, 0);
      const done = ((evs.data ?? []) as unknown as Array<{ status: string }>).filter((e) => ['COMPLETED', 'CLOSED'].includes(e.status)).length;
      const tls = (tl.data ?? []) as unknown as Array<{ done_at: string | null; planned_at: string }>;
      const withDone = tls.filter((t) => t.done_at);
      const onTimePct = withDone.length ? Math.round((withDone.filter((t) => new Date(t.done_at as string) <= new Date(new Date(t.planned_at).getTime() + 30 * 60000)).length / withDone.length) * 100) : 0;
      setM({
        leads: leads.count ?? 0, inquiries: iq.count ?? 0, quotes: qRows.length, bookings: bookings.count ?? 0,
        revenue, paid, eventsDone: done, incidents: inc.count ?? 0, complaints: comp.count ?? 0,
        onTime: withDone.length ? `${onTimePct}% (${withDone.length} tonggak)` : '—',
        avgOrder: qRows.length ? Math.round(revenue / qRows.length) : 0,
        monthly: months,
        byType: [...typeMap.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menghitung');
    }
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Analitik" />;
  if (err) return <ErrorState text={err} retry={load} />;
  if (!m) return <Loading label="Menghitung analitik…" />;

  const conv = m.inquiries ? Math.round((m.bookings / m.inquiries) * 100) : 0;
  return (
    <div>
      <p className="h-section mb-2">Penjualan</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Leads" value={String(m.leads)} />
        <Stat label="Inquiry" value={String(m.inquiries)} />
        <Stat label="Quotation" value={String(m.quotes)} />
        <Stat label="Konversi inquiry→booking" value={`${conv}%`} sub={`${m.bookings} booking`} />
      </div>
      <p className="h-section mb-2">Keuangan</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Omzet (approved)" value={rp(m.revenue)} />
        <Stat label="Kas masuk" value={rp(m.paid)} />
        <Stat label="Rata-rata order" value={rp(m.avgOrder)} />
        <Stat label="Event selesai" value={String(m.eventsDone)} />
      </div>
      <p className="h-section mb-2">Operasi & pelanggan</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Setup tepat waktu*" value={m.onTime} sub="*toleransi 30 mnt" />
        <Stat label="Insiden" value={String(m.incidents)} />
        <Stat label="Komplain" value={String(m.complaints)} />
        <Stat label="Event selesai" value={String(m.eventsDone)} sub="tertutup & selesai" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Tren kas masuk" sub="Pembayaran PAID 6 bulan terakhir (data nyata).">
          <Sparkline data={m.monthly} />
        </Section>
        <Section title="Komposisi acara" sub="Hitung event per tipe (data nyata).">
          <Donut data={m.byType} />
        </Section>
      </div>
    </div>
  );
}

const DONUT_COLORS = ['#B45309', '#3F6212', '#1D4ED8', '#C2410C', '#0E7490', '#7C3AED', '#78716C'];

/** Garis tren SVG dari angka nyata (tanpa lib chart). */
function Sparkline({ data }: { data: Array<{ label: string; total: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const W = 320;
  const H = 110;
  const pts = data.map((d, i) => {
    const x = 10 + (i * (W - 20)) / Math.max(1, data.length - 1);
    const y = H - 18 - ((d.total / max) * (H - 36));
    return `${x},${y}`;
  });
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Tren kas masuk 6 bulan">
        <polyline points={pts.join(' ')} fill="none" stroke="#B45309" strokeWidth="2.5" strokeLinejoin="round" />
        {data.map((d, i) => {
          const [x, y] = pts[i].split(',').map(Number);
          return (
            <g key={d.label}>
              <circle cx={x} cy={y} r="3.5" fill="#B45309" />
              <text x={x} y={H - 4} textAnchor="middle" fontSize="9" fill="#78716C">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <p className="muted mt-1">Maks {rp(max)} · dari {data.filter((d) => d.total > 0).length} bulan bertransaksi.</p>
    </div>
  );
}

/** Donat conic-gradient dari hitungan nyata + legenda. */
function Donut({ data }: { data: Array<{ type: string; count: number }> }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  if (!total) return <p className="muted">Belum ada event.</p>;
  let acc = 0;
  const segs = data.map((d, i) => {
    const from = (acc / total) * 360;
    acc += d.count;
    const to = (acc / total) * 360;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${from}deg ${to}deg`;
  });
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${segs.join(', ')})` }}
        role="img"
        aria-label={`Komposisi ${total} event`}
      />
      <ul className="text-[14px]">
        {data.map((d, i) => (
          <li key={d.type} className="flex items-center gap-2 py-0.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} aria-hidden="true" />
            {d.type} — <b>{d.count}</b> ({Math.round((d.count / total) * 100)}%)
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <CapabilityGate route="/analytics">
      <PageHeader title="Analytics" sub="Penjualan, keuangan, operasi — semua dari data nyata." />
      <Section title="Kinerja bisnis"><An /></Section>
    </CapabilityGate>
  );
}
