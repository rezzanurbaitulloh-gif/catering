'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { fmtDate, rp } from '@/lib/format';
import type { EventRow } from '@/lib/types';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty } from '@/components/ui';

interface Health extends EventRow {
  open_incidents: number;
  paid_total: number;
  staff_assigned: number;
}

// Event Control Center: kesehatan tiap event aktif dalam satu layar.
function Board() {
  const { businessId } = useBusiness();
  const [rows, setRows] = useState<Health[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const sb = supabaseBrowser();
        const { data, error } = await sb
          .from('events')
          .select('*')
          .eq('business_id', businessId)
          .not('status', 'in', '(COMPLETED,CLOSED)')
          .order('event_date', { ascending: true })
          .limit(30);
        if (error) throw new Error(error.message);
        const list = (data ?? []) as unknown as EventRow[];
        const out: Health[] = await Promise.all(
          list.map(async (e) => {
            const [inc, pay, staff] = await Promise.all([
              sb.from('incidents').select('id').eq('event_id', e.id).not('status', 'in', '(RESOLVED,CLOSED)'),
              sb.from('payments').select('amount').eq('event_id', e.id).eq('status', 'PAID'),
              sb.from('staff_assignments').select('id').eq('event_id', e.id),
            ]);
            return {
              ...e,
              open_incidents: (inc.data ?? []).length,
              paid_total: ((pay.data ?? []) as unknown as { amount: number }[]).reduce((a, p) => a + p.amount, 0),
              staff_assigned: (staff.data ?? []).length,
            };
          })
        );
        if (alive) setRows(out);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Gagal memuat');
      }
    })();
    return () => { alive = false; };
  }, [businessId]);

  if (err) return <ErrorState text={err} />;
  if (!rows) return <Loading label="Memuat pusat kendali…" />;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.length === 0 ? <Empty text="Tidak ada event aktif." /> : rows.map((e) => {
        const pax = e.pax_final ?? e.pax_confirmed;
        const risk = (!e.pax_locked ? 1 : 0) + (e.payment_status !== 'PAID' ? 1 : 0) + (e.open_incidents > 0 ? 1 : 0);
        return (
          <Link key={e.id} href={`/events/${e.id}`} className="card hover:bg-cream">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{e.event_no}</p>
              <StatusPill status={risk >= 2 ? 'HIGH' : risk === 1 ? 'MEDIUM' : 'LOW'} />
            </div>
            <p className="font-display text-[18px] mt-0.5">{e.title}</p>
            <p className="muted">{fmtDate(e.event_date)} · {pax} pax · {e.venue_text ?? 'Venue terdaftar'}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <StatusPill status={e.status} />
              <StatusPill status={e.payment_status} />
              {e.pax_locked ? <StatusPill status="LOCKED" /> : <StatusPill status="PLANNING" />}
              {e.open_incidents > 0 ? <StatusPill status="OPEN" /> : null}
            </div>
            <p className="muted mt-2">Masuk {rp(e.paid_total)} · Staf {e.staff_assigned} · Insiden terbuka {e.open_incidents}</p>
          </Link>
        );
      })}
    </div>
  );
}

export default function ControlPage() {
  return (
    <CapabilityGate route="/control">
      <PageHeader title="Event Control Center" sub="Kesehatan tiap event aktif: pelanggan, keuangan, produksi, logistik, insiden." />
      <Section title="Operasi berjalan"><Board /></Section>
    </CapabilityGate>
  );
}
