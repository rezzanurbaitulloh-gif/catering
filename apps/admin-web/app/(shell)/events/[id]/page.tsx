'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import { rp, fmtDate, fmtDateTime } from '@/lib/format';
import { EventMachine, ProductionMachine } from '@/lib/vendored-machines';
import { packingDiscrepancy } from '@/lib/vendored-risk';
import type { EventRow } from '@/lib/types';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act } from '@/components/ui';

interface Full {
  event: EventRow & { customers?: { name: string; phone: string } | null; venues?: { name: string; address: string } | null };
  timelines: Array<{ id: string; label: string; planned_at: string; done_at: string | null; owner: string | null }>;
  items: Array<{ id: string; name: string; category: string; required_qty: number | null; packed_qty: number; unit: string }>;
  plans: Array<{ id: string; status: string; target_qty: number; actual_qty: number | null; production_batches: Array<{ id: string; name: string; status: string; target_qty: number; actual_qty: number | null }> }>;
  transport: Array<{ id: string; kind: string; status: string; departed_at: string | null; eta_at: string | null; arrived_at: string | null; receiver_name: string | null; note: string | null }>;
  staff: Array<{ staff_id: string; role: string; staff: { name: string; phone: string | null } }>;
  equipment: Array<{ equipment_id: string; qty: number; loaded_qty: number; equipment: { name: string } }>;
  recon: Array<{ equipment_id: string; assigned: number; loaded: number; returned: number; missing: number; damaged: number; note: string | null; equipment: { name: string } }>;
  payments: Array<{ id: string; amount: number; method: string; kind: string; status: string; received_at: string | null; reference: string | null }>;
  expenses: Array<{ id: string; category: string; amount: number; note: string | null; spent_at: string }>;
  incidents: Array<{ id: string; incident_no: string; title: string; severity: string; status: string }>;
  changes: Array<{ id: string; type: string; status: string; payload: Record<string, unknown> }>;
  audits: Array<{ id: string; action: string; entity: string; created_at: string }>;
  profit: { revenue: number; food_cost: number; labor_cost: number; transport_cost: number; vendor_cost: number; other_cost: number; estimated_profit: number; margin_pct: number; paid: number; outstanding: number } | null;
}

const NEXT_LABEL: Record<string, string> = {
  LOCKED: 'Kunci perencanaan', IN_PREPARATION: 'Mulai persiapan', IN_TRANSIT: 'Berangkat',
  SETUP: 'Mulai setup', SERVICE: 'Mulai layanan', BREAKDOWN: 'Mulai beres-beres',
  COMPLETED: 'Selesaikan', CLOSED: 'Tutup event',
};

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { businessId, isDemo } = useBusiness();
  const [d, setD] = useState<Full | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [pax, setPax] = useState('');
  const [payAmt, setPayAmt] = useState('');
  const [payKind, setPayKind] = useState('DP');

  const load = useCallback(async () => {
    setErr(null);
    try {
      const sb = supabaseBrowser();
      const { data: event, error: eErr } = await sb
        .from('events')
        .select('*,customers(name,phone),venues(name,address)')
        .eq('business_id', businessId)
        .eq('id', params.id)
        .maybeSingle();
      if (eErr) throw new Error(eErr.message);
      if (!event) throw new Error('Event tidak ditemukan');
      const ev = event as Full['event'];
      const get = async (t: string, sel = '*'): Promise<unknown[]> => ((await sb.from(t).select(sel).eq('event_id', params.id)).data ?? []) as unknown as unknown[];
      const [timelines, items, plans, transport, staff, equipment, recon, payments, expenses, incidents, changes] = await Promise.all([
        get('event_timelines'), get('event_items'),
        sb.from('production_plans').select('id,status,target_qty,actual_qty,production_batches(id,name,status,target_qty,actual_qty)').eq('event_id', params.id).then((r) => r.data ?? []),
        get('transport_tasks'), 
        sb.from('staff_assignments').select('staff_id,role,staff(name,phone)').eq('event_id', params.id).then((r) => r.data ?? []),
        sb.from('equipment_assignments').select('equipment_id,qty,loaded_qty,equipment(name)').eq('event_id', params.id).then((r) => r.data ?? []),
        sb.from('equipment_reconciliation').select('equipment_id,assigned,loaded,returned,missing,damaged,note,equipment(name)').eq('event_id', params.id).then((r) => r.data ?? []),
        get('payments'), get('expenses'),
        sb.from('incidents').select('id,incident_no,title,severity,status').eq('event_id', params.id).then((r) => r.data ?? []),
        get('change_requests'),
      ]);
      const { data: audits } = await sb.from('audit_logs').select('id,action,entity,created_at').eq('entity_id', params.id).order('created_at', { ascending: false }).limit(20);
      let profit: Full['profit'] = null;
      try {
        profit = await apiJson(`/api/events/${params.id}/profitability`);
      } catch { profit = null; }
      setD({
        event: ev, timelines: timelines as Full['timelines'], items: items as Full['items'],
        plans: plans as unknown as Full['plans'], transport: transport as Full['transport'],
        staff: staff as unknown as Full['staff'], equipment: equipment as unknown as Full['equipment'],
        recon: recon as unknown as Full['recon'], payments: payments as Full['payments'],
        expenses: expenses as Full['expenses'], incidents: incidents as Full['incidents'],
        changes: changes as Full['changes'], audits: (audits ?? []) as unknown as Full['audits'], profit,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal memuat event');
    }
  }, [businessId, params.id]);

  useEffect(() => { load(); }, [load]);

  async function act(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    try { await fn(); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Aksi gagal'); }
    finally { setBusy(''); }
  }

  if (err && !d) return <div><PageHeader title="Event" /><ErrorState text={err} retry={load} /></div>;
  if (!d) return <Loading label="Memuat pusat kendali event…" />;

  const ev = d.event;
  const nexts = EventMachine.next(ev.status);
  const alerts = d.items
    .map((i) => (i.required_qty != null ? packingDiscrepancy(Number(i.packed_qty), Number(i.required_qty), i.name) : null))
    .filter(Boolean) as string[];

  return (
    <div>
      <PageHeader
        title={`${ev.event_no}`}
        sub={`${ev.title} · ${ev.event_type} · ${fmtDate(ev.event_date)}`}
        action={<div className="flex gap-2">{nexts.map((n) => (
          <Act key={n} tone="gold" disabled={isDemo || !!busy} onClick={() => act(n, () => apiJson(`/api/events/${ev.id}/transition`, { method: 'POST', body: JSON.stringify({ to: n }) }))}>
            {busy === n ? '…' : (NEXT_LABEL[n] ?? n)}
          </Act>
        ))}</div>}
      />
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="flex flex-wrap gap-2 mb-4">
        <StatusPill status={ev.status} />
        <StatusPill status={ev.payment_status} />
        {ev.pax_locked ? <StatusPill status="LOCKED" /> : null}
        {alerts.map((a) => <span key={a} className="pill bg-danger text-white" role="alert">{a}</span>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Ringkasan">
          <dl className="grid grid-cols-2 gap-2 text-[14px]">
            <div><dt className="muted">Pelanggan</dt><dd className="font-semibold">{ev.customers?.name ?? '—'}</dd><dd className="muted">{ev.customers?.phone ?? ''}</dd></div>
            <div><dt className="muted">Venue</dt><dd className="font-semibold">{ev.venues?.name ?? ev.venue_text ?? '—'}</dd><dd className="muted">{ev.venues?.address ?? ''}</dd></div>
            <div><dt className="muted">Mulai</dt><dd>{fmtDateTime(ev.start_at)}</dd></div>
            <div><dt className="muted">Gaya layanan</dt><dd>{ev.service_style ?? 'Prasmanan'}</dd></div>
          </dl>
          {ev.special_instructions ? <p className="mt-2 text-[14px]"><b>Instruksi khusus:</b> {ev.special_instructions}</p> : null}
          <div className="mt-2 rounded-[10px] bg-[#B91C1C]/5 border border-danger/30 p-3 text-[14px]">
            <p className="font-bold text-danger">Diet & alergi (prioritas)</p>
            <p className="mt-1">Vegetarian: {ev.vegetarian} · Vegan: {ev.vegan} · Alergi: {(ev.allergies ?? []).join(', ') || '—'}</p>
            {ev.dietary_notes ? <p>Catatan: {ev.dietary_notes}</p> : null}
          </div>
        </Section>

        <Section title="Pax" sub="Estimasi → penawaran → konfirmasi → final terkunci.">
          <p className="text-[15px]">Estimasi {ev.pax_estimated} · Quoted {ev.pax_quoted} · Konfirmasi {ev.pax_confirmed} · Final <b>{ev.pax_final ?? '—'}</b></p>
          {!ev.pax_locked && !isDemo ? (
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (pax) act('pax', () => apiJson(`/api/events/${ev.id}/pax-lock`, { method: 'POST', body: JSON.stringify({ pax_final: Number(pax) }) })); }}>
              <input className="field" type="number" min={1} value={pax} onChange={(e) => setPax(e.target.value)} placeholder="Final pax" aria-label="Final pax" />
              <button type="submit" className="btn-primary !min-h-[40px] !px-3 !text-[14px]" disabled={!!busy}>{busy === 'pax' ? '…' : 'Kunci'}</button>
            </form>
          ) : null}
        </Section>

        <Section title="Jadwal (timeline)">
          {d.timelines.length === 0 ? <Empty text="Belum ada jadwal." /> : (
            <ul className="flex flex-col gap-1.5 text-[14px]">
              {d.timelines.map((t) => (
                <li key={t.id} className="flex justify-between gap-2 border-b border-line pb-1.5 last:border-0">
                  <span>{t.done_at ? '✓ ' : ''}{t.label}{t.owner ? ` · ${t.owner}` : ''}</span>
                  <span className="muted shrink-0">{fmtDateTime(t.planned_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Menu & packing" sub="required vs packed — selisih selalu terlihat.">
          {d.items.length === 0 ? <Empty text="Belum ada item." hint="Tambahkan via database/admin saat setup." /> : (
            <ul className="flex flex-col gap-1.5 text-[14px]">
              {d.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2 border-b border-line pb-1.5 last:border-0">
                  <span>[{i.category}] {i.name}</span>
                  <b className={i.required_qty != null && Number(i.packed_qty) < Number(i.required_qty) ? 'text-danger' : 'text-leaf'}>
                    {i.packed_qty}/{i.required_qty ?? '?'} {i.unit}
                  </b>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Produksi" sub="PLANNED → PREPARING → PRODUCING → QC → COMPLETED.">
          {d.plans.length === 0 ? <Empty text="Belum ada rencana produksi." /> : d.plans.map((p) => (
            <div key={p.id} className="mb-3 rounded-[10px] border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[15px]">Target {p.target_qty}{p.actual_qty != null ? ` · aktual ${p.actual_qty}` : ''}</p>
                <StatusPill status={p.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ProductionMachine.next(p.status).map((n) => (
                  <Act key={n} disabled={isDemo || !!busy} onClick={() => act(`${p.id}${n}`, () => apiJson('/api/ops/production', { method: 'POST', body: JSON.stringify({ table: 'production_plans', id: p.id, to: n }) }))}>
                    {busy === `${p.id}${n}` ? '…' : `→ ${n}`}
                  </Act>
                ))}
              </div>
              {p.production_batches.map((b) => (
                <div key={b.id} className="mt-2 flex items-center justify-between gap-2 text-[14px] border-t border-line pt-2">
                  <span>{b.name} ({b.target_qty})</span>
                  <span className="flex items-center gap-1.5">
                    <StatusPill status={b.status} />
                    {ProductionMachine.next(b.status).map((n) => (
                      <Act key={n} disabled={isDemo || !!busy} onClick={() => act(`${b.id}${n}`, () => apiJson('/api/ops/production', { method: 'POST', body: JSON.stringify({ table: 'production_batches', id: b.id, to: n }) }))}>
                        {busy === `${b.id}${n}` ? '…' : `→ ${n}`}
                      </Act>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </Section>

        <Section title="Logistik & venue ops" sub="Keberangkatan → tiba → setup → layanan → beres.">
          {d.transport.length === 0 ? <Empty text="Belum ada tugas transport." /> : d.transport.map((t) => (
            <div key={t.id} className="mb-2 rounded-[10px] border border-line p-3 text-[14px]">
              <div className="flex justify-between gap-2"><b>{t.kind}</b><StatusPill status={t.status} /></div>
              <p className="muted mt-1">Berangkat: {fmtDateTime(t.departed_at)} · ETA: {fmtDateTime(t.eta_at)} · Tiba: {fmtDateTime(t.arrived_at)}</p>
              {t.receiver_name ? <p>Penerima: {t.receiver_name}</p> : null}
              {t.note ? <p>Catatan: {t.note}</p> : null}
            </div>
          ))}
        </Section>

        <Section title="Tim & kehadiran">
          {d.staff.length === 0 ? <Empty text="Belum ada penugasan staf." /> : (
            <ul className="flex flex-col gap-1.5 text-[14px]">
              {d.staff.map((s) => (
                <li key={s.staff_id} className="flex justify-between gap-2 border-b border-line pb-1.5 last:border-0">
                  <span>{s.staff.name} <span className="muted">· {s.role}</span></span>
                  <span className="muted">{s.staff.phone ?? ''}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Peralatan & rekonsiliasi">
          {d.equipment.length === 0 && d.recon.length === 0 ? <Empty text="Belum ada data peralatan." /> : (
            <div className="text-[14px]">
              {d.equipment.map((e) => (
                <p key={e.equipment_id} className="flex justify-between border-b border-line py-1.5"><span>{e.equipment.name}</span><span>dimuat {e.loaded_qty}/{e.qty}</span></p>
              ))}
              {d.recon.map((r) => (
                <p key={r.equipment_id} className="flex justify-between border-b border-line py-1.5">
                  <span>{r.equipment.name} (retur)</span>
                  <b className={r.missing > 0 ? 'text-danger' : 'text-leaf'}>kembali {r.returned}/{r.assigned}{r.missing > 0 ? ` · HILANG ${r.missing}` : ''}{r.damaged ? ` · rusak ${r.damaged}` : ''}</b>
                </p>
              ))}
            </div>
          )}
        </Section>

        <Section title="Keuangan" sub="DP → pelunasan; estimasi vs aktual.">
          {d.profit ? (
            <div className="grid grid-cols-2 gap-2 text-[14px] mb-3">
              <div className="card !bg-cream"><p className="muted">Omzet</p><p className="font-bold">{rp(d.profit.revenue)}</p></div>
              <div className="card !bg-cream"><p className="muted">Masuk</p><p className="font-bold">{rp(d.profit.paid)}</p></div>
              <div className="card !bg-cream"><p className="muted">Sisa tagihan</p><p className="font-bold text-danger">{rp(d.profit.outstanding)}</p></div>
              <div className="card !bg-cream"><p className="muted">Est. laba</p><p className="font-bold text-leaf">{rp(d.profit.estimated_profit)} ({d.profit.margin_pct}%)</p></div>
            </div>
          ) : <p className="muted text-[14px] mb-2">Ringkasan laba butuh modul profitability (login).</p>}
          <ul className="flex flex-col gap-1.5 text-[14px]">
            {d.payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 border-b border-line pb-1.5 last:border-0">
                <span>{p.kind} · {p.method}{p.reference ? ` · ${p.reference}` : ''}</span>
                <b>{rp(p.amount)} · {p.status}</b>
              </li>
            ))}
          </ul>
          {!isDemo ? (
            <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (payAmt) act('pay', () => apiJson('/api/payments', { method: 'POST', body: JSON.stringify({ event_id: ev.id, amount: Number(payAmt), method: 'TRANSFER', kind: payKind }) })); setPayAmt(''); }}>
              <input className="field !w-40" type="number" min={1000} value={payAmt} onChange={(e) => setPayAmt(e.target.value)} placeholder="Nominal Rp" aria-label="Nominal pembayaran" />
              <select className="field !w-32" value={payKind} onChange={(e) => setPayKind(e.target.value)} aria-label="Jenis pembayaran">
                <option value="DP">DP</option><option value="FINAL">Pelunasan</option><option value="FULL">Lunas</option>
              </select>
              <button type="submit" className="btn-primary !min-h-[40px] !px-3 !text-[14px]" disabled={!!busy}>{busy === 'pay' ? '…' : 'Catat'}</button>
            </form>
          ) : null}
          {d.expenses.length ? (
            <p className="mt-2 text-[14px] muted">Biaya: {d.expenses.map((x) => `${x.category} ${rp(x.amount)}`).join(' · ')}</p>
          ) : null}
        </Section>

        <Section title="Insiden & perubahan">
          {d.incidents.length === 0 ? <p className="muted text-[14px]">Tidak ada insiden.</p> : d.incidents.map((i) => (
            <Link key={i.id} href="/incidents" className="rowcard mb-1.5">
              <span className="text-[14px] font-semibold">{i.incident_no} — {i.title}</span>
              <span className="flex gap-1.5"><StatusPill status={i.severity} /><StatusPill status={i.status} /></span>
            </Link>
          ))}
          {d.changes.length === 0 ? <p className="muted text-[14px] mt-2">Tidak ada change request.</p> : d.changes.map((c) => (
            <p key={c.id} className="text-[14px] mt-1 flex justify-between gap-2 border-b border-line pb-1">
              <span>{c.type} · {JSON.stringify(c.payload)}</span><StatusPill status={c.status} />
            </p>
          ))}
        </Section>

        <Section title="Audit" sub="Jejak perubahan penting event ini.">
          {d.audits.length === 0 ? <Empty text="Belum ada jejak audit." /> : (
            <ul className="flex flex-col gap-1 text-[13px] muted">
              {d.audits.map((a) => (
                <li key={a.id} className="flex justify-between gap-2 border-b border-line pb-1 last:border-0">
                  <span>{a.action} · {a.entity}</span><span>{fmtDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
