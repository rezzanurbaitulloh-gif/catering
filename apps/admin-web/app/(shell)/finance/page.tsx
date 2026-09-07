'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import { rp, fmtDate } from '@/lib/format';
import type { PaymentRow, ExpenseRow, EventRow } from '@/lib/types';
import { PageHeader, Section, Stat, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

function Fin() {
  const { businessId, isDemo } = useBusiness();
  const [pays, setPays] = useState<(PaymentRow & { events?: { event_no: string } | null })[] | null>(null);
  const [exps, setExps] = useState<ExpenseRow[] | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [sel, setSel] = useState('');
  const [profit, setProfit] = useState<Record<string, number> | null>(null);
  const [f, setF] = useState({ event_id: '', amount: '', kind: 'DP' });

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data: p, error: pErr }, { data: e }, { data: ev }] = await Promise.all([
      sb.from('payments').select('*,events(event_no)').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100),
      sb.from('expenses').select('*').eq('business_id', businessId).order('spent_at', { ascending: false }).limit(100),
      sb.from('events').select('*').eq('business_id', businessId).order('event_date', { ascending: false }).limit(50),
    ]);
    if (pErr) { setErr(pErr.message); return; }
    setPays((p ?? []) as unknown as (PaymentRow & { events?: { event_no: string } | null })[]);
    setExps((e ?? []) as unknown as ExpenseRow[]);
    setEvents((ev ?? []) as unknown as EventRow[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  useEffect(() => {
    if (!sel) { setProfit(null); return; }
    apiJson<Record<string, number>>(`/api/events/${sel}/profitability`).then(setProfit).catch(() => setProfit(null));
  }, [sel]);
  if (isDemo) return <LoginRequired what="Data keuangan" />;

  const paid = (pays ?? []).filter((p) => p.status === 'PAID').reduce((a, p) => a + p.amount, 0);
  const out = (exps ?? []).reduce((a, e) => a + e.amount, 0);

  async function addPay() {
    if (!f.event_id || !Number(f.amount)) { setErr('Pilih event & isi nominal.'); return; }
    setErr(null); setBusy('pay');
    try {
      await apiJson('/api/payments', { method: 'POST', body: JSON.stringify({ event_id: f.event_id, amount: Number(f.amount), method: 'TRANSFER', kind: f.kind }) });
      setF({ event_id: '', amount: '', kind: 'DP' });
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); }
    finally { setBusy(''); }
  }

  if (err && !pays) return <ErrorState text={err} retry={load} />;
  if (!pays || !exps) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Kas masuk (lunas)" value={rp(paid)} />
        <Stat label="Belanja tercatat" value={rp(out)} />
        <Stat label="Transaksi" value={String(pays.length)} />
        <Stat label="Event" value={String(events.length)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Catat pembayaran">
          <div className="grid gap-2">
            <select className="field" value={f.event_id} onChange={(e) => setF({ ...f, event_id: e.target.value })} aria-label="Event">
              <option value="">— Pilih event —</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.event_no} · {e.title}</option>)}
            </select>
            <div className="flex gap-2">
              <input className="field" type="number" min={1000} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Nominal Rp" aria-label="Nominal" />
              <select className="field !w-32" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} aria-label="Jenis">
                <option value="DP">DP</option><option value="FINAL">Pelunasan</option><option value="FULL">Lunas</option>
              </select>
            </div>
            <Act tone="primary" onClick={addPay} disabled={busy === 'pay'}>{busy === 'pay' ? '…' : 'Simpan pembayaran'}</Act>
          </div>
          <ul className="mt-3 flex flex-col gap-1.5 text-[14px]">
            {pays.length === 0 ? <Empty text="Belum ada pembayaran." /> : pays.slice(0, 15).map((p) => (
              <li key={p.id} className="flex justify-between gap-2 border-b border-line pb-1.5 last:border-0">
                <span>{p.events?.event_no} · {p.kind} · {p.method}</span>
                <span><b>{rp(p.amount)}</b> <StatusPill status={p.status} /></span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Profitabilitas per event" sub="Omzet vs biaya; estimasi vs aktual.">
          <select className="field" value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Pilih event">
            <option value="">— Pilih event —</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.event_no} · {fmtDate(e.event_date)}</option>)}
          </select>
          {profit ? (
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[14px]">
              {([['Omzet', profit.revenue], ['Masuk', profit.paid], ['Sisa', profit.outstanding], ['Bahan', profit.food_cost], ['Tenaga', profit.labor_cost], ['Transport', profit.transport_cost], ['Vendor', profit.vendor_cost], ['Lainnya', profit.other_cost]] as Array<[string, number]>).map(([k, v]) => (
                <div key={k} className="card !bg-cream"><dt className="muted">{k}</dt><dd className="font-bold">{rp(v)}</dd></div>
              ))}
              <div className="card col-span-2"><dt className="muted">Estimasi laba</dt><dd className="font-display text-[22px] text-leaf font-bold">{rp(profit.estimated_profit)} ({profit.margin_pct}%)</dd></div>
            </dl>
          ) : <p className="muted mt-2 text-[14px]">Pilih event untuk melihat rincian.</p>}
        </Section>
      </div>
    </div>
  );
}

export default function FinancePage() {
  return (
    <div>
      <PageHeader title="Finance" sub="Uang masuk, belanja, dan laba per event." />
      <Section title="Keuangan"><Fin /></Section>
    </div>
  );
}
