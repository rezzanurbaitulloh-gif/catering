'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import { IncidentMachine } from '@/lib/vendored-machines';
import { fmtDateTime } from '@/lib/format';
import type { IncidentRow, EventRow } from '@/lib/types';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

function Inc() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<(IncidentRow & { events?: { event_no: string } | null })[] | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [f, setF] = useState({ event_id: '', category: 'Operasional', severity: 'MEDIUM', title: '', description: '' });

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data, error }, { data: ev }] = await Promise.all([
      sb.from('incidents').select('*,events(event_no)').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100),
      sb.from('events').select('*').eq('business_id', businessId).not('status', 'in', '(CLOSED)').order('event_date', { ascending: false }).limit(50),
    ]);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as (IncidentRow & { events?: { event_no: string } | null })[]);
    setEvents((ev ?? []) as unknown as EventRow[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data insiden" />;

  async function create() {
    if (f.title.trim().length < 4 || f.description.trim().length < 10) { setErr('Judul (min 4) & kronologi (min 10) wajib.'); return; }
    setErr(null); setBusy('new');
    try {
      const r = await apiJson<{ incident_no: string }>('/api/incidents', {
        method: 'POST',
        body: JSON.stringify({ event_id: f.event_id || null, category: f.category, severity: f.severity, title: f.title.trim(), description: f.description.trim() }),
      });
      void r;
      setF({ event_id: '', category: 'Operasional', severity: 'MEDIUM', title: '', description: '' });
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); }
    finally { setBusy(''); }
  }

  async function adv(id: string, from: string, to: string) {
    setErr(null); setBusy(id + to);
    try {
      await apiJson(`/api/incidents/${id}/transition`, { method: 'POST', body: JSON.stringify({ to }) });
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); }
    finally { setBusy(''); }
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="card mb-3">
        <p className="font-semibold mb-2">Lapor insiden</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <select className="field" value={f.event_id} onChange={(e) => setF({ ...f, event_id: e.target.value })} aria-label="Event terkait">
            <option value="">— Tanpa event —</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.event_no} · {e.title}</option>)}
          </select>
          <div className="flex gap-2">
            <input className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Kategori" aria-label="Kategori" />
            <select className="field" value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })} aria-label="Severity">
              <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
            </select>
          </div>
          <input className="field sm:col-span-2" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Judul singkat" aria-label="Judul" />
          <textarea className="field sm:col-span-2" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Kronologi: apa, kapan, di mana, dampak" aria-label="Kronologi" />
        </div>
        <Act tone="primary" onClick={create} disabled={busy === 'new'}>{busy === 'new' ? '…' : 'Laporkan'}</Act>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? <Empty text="Nihil insiden. Pertahankan." /> : rows.map((i) => (
          <div key={i.id} className="card">
            <div className="flex justify-between gap-2 flex-wrap">
              <p className="font-semibold text-[15px]">{i.incident_no} — {i.title}</p>
              <span className="flex gap-1.5"><StatusPill status={i.severity} /><StatusPill status={i.status} /></span>
            </div>
            <p className="text-[14px] mt-1">{i.description}</p>
            <p className="muted text-[13px] mt-1">{i.events?.event_no ?? 'Tanpa event'} · {i.category} · {fmtDateTime(i.created_at)}</p>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {IncidentMachine.next(i.status).map((n) => (
                <Act key={n} disabled={!!busy} onClick={() => adv(i.id, i.status, n)}>{busy === i.id + n ? '…' : `→ ${n}`}</Act>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <div>
      <PageHeader title="Incidents" sub="Lapor → selidiki → tindak → selesai. Tiap insiden punya pemilik & bukti." />
      <Section title="Insiden & keluhan lapangan"><Inc /></Section>
    </div>
  );
}
