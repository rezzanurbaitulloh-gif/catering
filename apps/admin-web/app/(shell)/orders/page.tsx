'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { InquiryMachine } from '@/lib/vendored-machines';
import type { InquiryRow } from '@/lib/types';
import { PageHeader, StatusPill, Loading, ErrorState, Empty, LoginRequired, Act } from '@/components/ui';

const FILTERS = ['SEMUA', 'NEW', 'CONTACTED', 'QUOTED', 'BOOKED'] as const;

export default function OrdersPage() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<InquiryRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('SEMUA');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      const { data, error } = await supabaseBrowser()
        .from('inquiries')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setRows((data ?? []) as unknown as InquiryRow[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal memuat orders');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function advance(row: InquiryRow, to: string) {
    try {
      InquiryMachine.assert(row.status, to);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Transisi ditolak');
      return;
    }
    setBusy(row.id + to);
    try {
      // Validasi transisi diulang di server (route PATCH).
      await apiJson(`/api/inquiries/${row.id}`, { method: 'PATCH', body: JSON.stringify({ status: to }) });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setBusy(null);
    }
  }

  /** Ubah inquiry menjadi event PLANNING + booking (server-side, route convert). */
  async function convertToEvent(row: InquiryRow) {
    if (!['NEW', 'CONTACTED', 'QUOTED'].includes(row.status)) {
      setErr('Hanya inquiry NEW/CONTACTED/QUOTED yang bisa dikonversi menjadi event.');
      return;
    }
    setBusy(row.id + 'convert');
    try {
      const r = await apiJson<{ event_no: string }>(`/api/inquiries/${row.id}`, { method: 'POST' });
      setErr(null);
      await load();
      window.location.href = '/events';
      void r;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Konversi gagal');
    } finally {
      setBusy(null);
    }
  }

  if (err) return (
    <div>
      <PageHeader title="Orders" sub="Inquiry → follow-up → penawaran → booking." />
      {isDemo ? <LoginRequired what="Daftar inquiry" /> : <ErrorState text={err} retry={load} />}
    </div>
  );
  if (!rows) return <Loading label="Memuat inquiry…" />;

  const shown = filter === 'SEMUA' ? rows : rows.filter((r) => r.status === filter);

  return (
    <div>
      <PageHeader title="Orders" sub="Setiap inquiry: siapa, kapan, berapa pax — dan langkah berikutnya." />
      {err && rows ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pill border ${filter === f ? 'bg-ink text-cream border-ink' : 'bg-paper border-line'}`}
          >
            {f === 'SEMUA' ? 'Semua' : f}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <Empty text="Tidak ada inquiry pada filter ini." />
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((r) => {
            const next = InquiryMachine.next(r.status);
            return (
              <div key={r.id} className="rowcard md:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-semibold text-[15px]">
                    {r.contact_name || 'Tanpa nama'} · {r.pax} pax · {r.event_type}
                  </p>
                  <p className="muted">
                    {r.contact_phone} · Acara {fmtDate(r.event_date)}
                    {r.venue_text ? ` · ${r.venue_text}` : ''}
                  </p>
                  {r.menu_notes ? <p className="text-[14px] mt-1">{r.menu_notes}</p> : null}
                  <div className="mt-1.5"><StatusPill status={r.status} /></div>
                </div>
                {!isDemo ? (
                  <div className="flex flex-wrap gap-1.5 md:justify-end">
                    {next.map((to) => (
                      <Act key={to} onClick={() => advance(r, to)} disabled={busy === r.id + to}>
                        → {to}
                      </Act>
                    ))}
                    {r.status === 'BOOKED' ? (
                      <span className="muted text-[13px]">Siap dibuatkan event setelah QUOTATION disetujui.</span>
                    ) : null}
                    {['NEW', 'CONTACTED', 'QUOTED'].includes(r.status) ? (
                      <Act tone="gold" onClick={() => convertToEvent(r)} disabled={busy === r.id + 'convert'}>
                        {busy === r.id + 'convert' ? '…' : 'Buat Event'}
                      </Act>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <p className="muted mt-4">
        Alur: NEW → CONTACTED → QUOTED → BOOKED. Tombol “Buat Event” membuat event PLANNING + booking sekaligus (server-side). Detail acara di <Link href="/events" className="text-gold font-semibold">Events</Link>.
      </p>
    </div>
  );
}
