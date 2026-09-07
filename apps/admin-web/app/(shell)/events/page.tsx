'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { fmtDate } from '@/lib/format';
import type { EventRow } from '@/lib/types';
import { PageHeader, StatusPill, Loading, ErrorState, Empty, LoginRequired } from '@/components/ui';

const STATUS = ['SEMUA', 'PLANNING', 'LOCKED', 'IN_PREPARATION', 'IN_TRANSIT', 'SETUP', 'SERVICE', 'BREAKDOWN', 'COMPLETED', 'CLOSED'] as const;

export default function EventsPage() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState<(typeof STATUS)[number]>('SEMUA');
  const [q, setQ] = useState('');

  async function load() {
    setErr(null);
    try {
      const { data, error } = await supabaseBrowser()
        .from('events')
        .select('*')
        .eq('business_id', businessId)
        .order('event_date', { ascending: true })
        .limit(200);
      if (error) throw error;
      setRows((data ?? []) as unknown as EventRow[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal memuat events');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  if (err) return (
    <div>
      <PageHeader title="Events" sub="Semua acara: jadwal, pax, status, pembayaran." />
      {isDemo ? <LoginRequired what="Daftar acara" /> : <ErrorState text={err} retry={load} />}
    </div>
  );
  if (!rows) return <Loading label="Memuat acara…" />;

  const shown = rows.filter(
    (r) =>
      (f === 'SEMUA' || r.status === f) &&
      (q === '' || `${r.event_no} ${r.title}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div>
      <PageHeader title="Events" sub={`${rows.length} acara terdaftar — ketuk untuk buka Event Control Center.`} />
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <input className="input md:max-w-xs" placeholder="Cari nomor / nama acara…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {STATUS.map((s) => (
          <button
            key={s}
            onClick={() => setF(s)}
            className={`pill border ${f === s ? 'bg-ink text-cream border-ink' : 'bg-paper border-line'}`}
          >
            {s === 'SEMUA' ? 'Semua' : s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <Empty text="Tidak ada acara cocok filter." />
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className="rowcard hover:bg-cream md:grid-cols-[1fr_auto_auto]">
              <div>
                <p className="font-semibold text-[15px]">{e.event_no} — {e.title}</p>
                <p className="muted">
                  {fmtDate(e.event_date)} · {e.pax_final ?? e.pax_confirmed ?? e.pax_estimated} pax
                  {e.pax_locked ? ' (terkunci)' : ' (belum kunci)'}
                </p>
              </div>
              <StatusPill status={e.status} />
              <StatusPill status={e.payment_status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
