'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import type { ChangeRequestRow, EventRow } from '@/lib/types';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

function CR() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<(ChangeRequestRow & { events?: { event_no: string } | null })[] | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [f, setF] = useState({ event_id: '', type: 'PAX', payload: '{"new_pax": 350}' });

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data, error }, { data: ev }] = await Promise.all([
      sb.from('change_requests').select('*,events(event_no)').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100),
      sb.from('events').select('*').eq('business_id', businessId).not('status', 'in', '(COMPLETED,CLOSED)').order('event_date').limit(50),
    ]);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as (ChangeRequestRow & { events?: { event_no: string } | null })[]);
    setEvents((ev ?? []) as unknown as EventRow[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Change request" />;

  async function act(id: string, fn: () => Promise<unknown>) {
    setErr(null); setBusy(id);
    try { await fn(); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Aksi gagal'); }
    finally { setBusy(''); }
  }

  async function create() {
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(f.payload); } catch { setErr('Payload harus JSON valid.'); return; }
    if (!f.event_id) { setErr('Pilih event.'); return; }
    await act('new', async () => {
      await supabaseBrowser().from('change_requests').insert({
        business_id: businessId, event_id: f.event_id, type: f.type, payload, status: 'PENDING',
      }).then((r) => { if (r.error) throw new Error(r.error.message); });
    });
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="card mb-3">
        <p className="font-semibold mb-2">Catat permintaan perubahan</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className="field" value={f.event_id} onChange={(e) => setF({ ...f, event_id: e.target.value })} aria-label="Event">
            <option value="">— Pilih event —</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.event_no} · {e.title}</option>)}
          </select>
          <select className="field" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label="Tipe">
            {['PAX', 'MENU', 'DATE', 'VENUE', 'ADDON', 'EQUIPMENT', 'DECOR', 'DURATION'].map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className="field font-mono" value={f.payload} onChange={(e) => setF({ ...f, payload: e.target.value })} aria-label="Payload JSON" />
        </div>
        <Act tone="primary" onClick={create} disabled={busy === 'new'}>{busy === 'new' ? '…' : 'Catat'}</Act>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? <Empty text="Belum ada change request." /> : rows.map((c) => (
          <div key={c.id} className="card">
            <div className="flex justify-between gap-2 flex-wrap">
              <p className="font-semibold text-[15px]">{c.events?.event_no ?? ''} · {c.type}</p>
              <StatusPill status={c.status} />
            </div>
            <p className="text-[14px] font-mono mt-1 break-all">{JSON.stringify(c.payload)}</p>
            {c.impact ? <p className="text-[13px] muted mt-1">Dampak: {JSON.stringify(c.impact)}</p> : null}
            <div className="mt-2 flex gap-1.5 flex-wrap">
              {c.status === 'PENDING' ? (<>
                <Act disabled={!!busy} onClick={() => act(c.id, async () => { const { error } = await supabaseBrowser().from('change_requests').update({ status: 'QUOTED' }).eq('id', c.id); if (error) throw new Error(error.message); })}>→ QUOTED</Act>
                <Act disabled={!!busy} onClick={() => act(c.id, async () => { const { error } = await supabaseBrowser().from('change_requests').update({ status: 'APPROVED' }).eq('id', c.id); if (error) throw new Error(error.message); })}>Setujui</Act>
                <Act disabled={!!busy} onClick={() => act(c.id, async () => { const { error } = await supabaseBrowser().from('change_requests').update({ status: 'REJECTED' }).eq('id', c.id); if (error) throw new Error(error.message); })}>Tolak</Act>
              </>) : null}
              {c.status === 'QUOTED' ? (
                <Act disabled={!!busy} onClick={() => act(c.id, async () => { const { error } = await supabaseBrowser().from('change_requests').update({ status: 'APPROVED' }).eq('id', c.id); if (error) throw new Error(error.message); })}>Setujui</Act>
              ) : null}
              {c.status === 'APPROVED' ? (
                <Act tone="gold" disabled={busy === c.id} onClick={() => act(c.id, () => apiJson(`/api/change-requests/${c.id}/apply`, { method: 'POST' }))}>
                  {busy === c.id ? '…' : 'Terapkan ke event'}
                </Act>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChangeRequestsPage() {
  return (
    <CapabilityGate route="/change-requests">
      <PageHeader title="Change Requests" sub="Permintaan → analisis dampak → revisi penawaran → persetujuan → terap." />
      <Section title="Daftar perubahan"><CR /></Section>
    </CapabilityGate>
  );
}
