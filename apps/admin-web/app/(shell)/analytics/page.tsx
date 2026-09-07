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
        sb.from('payments').select('amount,status').eq('business_id', b),
        sb.from('events').select('id,status').eq('business_id', b),
        sb.from('incidents').select('id', { count: 'exact', head: true }).eq('business_id', b),
        sb.from('complaints').select('id', { count: 'exact', head: true }).eq('business_id', b),
        sb.from('event_timelines').select('done_at,planned_at').limit(200),
      ]);
      const qRows = (quotes.data ?? []) as unknown as Array<{ total: number; status: string }>;
      const revenue = qRows.filter((q) => q.status === 'APPROVED').reduce((a, q) => a + q.total, 0);
      const paid = ((pays.data ?? []) as unknown as Array<{ amount: number; status: string }>).filter((p) => p.status === 'PAID').reduce((a, p) => a + p.amount, 0);
      const done = ((evs.data ?? []) as unknown as Array<{ status: string }>).filter((e) => ['COMPLETED', 'CLOSED'].includes(e.status)).length;
      const tls = (tl.data ?? []) as unknown as Array<{ done_at: string | null; planned_at: string }>;
      const withDone = tls.filter((t) => t.done_at);
      const onTimePct = withDone.length ? Math.round((withDone.filter((t) => new Date(t.done_at as string) <= new Date(new Date(t.planned_at).getTime() + 30 * 60000)).length / withDone.length) * 100) : 0;
      setM({
        leads: leads.count ?? 0, inquiries: iq.count ?? 0, quotes: qRows.length, bookings: bookings.count ?? 0,
        revenue, paid, eventsDone: done, incidents: inc.count ?? 0, complaints: comp.count ?? 0,
        onTime: withDone.length ? `${onTimePct}% (${withDone.length} tonggak)` : '—',
        avgOrder: qRows.length ? Math.round(revenue / qRows.length) : 0,
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Setup tepat waktu*" value={m.onTime} sub="*toleransi 30 mnt" />
        <Stat label="Insiden" value={String(m.incidents)} />
        <Stat label="Komplain" value={String(m.complaints)} />
        <Stat label="Event selesai" value={String(m.eventsDone)} sub="tertutup & selesai" />
      </div>
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
