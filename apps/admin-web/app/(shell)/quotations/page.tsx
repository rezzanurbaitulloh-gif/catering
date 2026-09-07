'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import { rp, fmtDate } from '@/lib/format';
import type { QuoteRow, QuoteVersionRow, CustomerRow } from '@/lib/types';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

interface Item { name: string; qty: number; unit_price: number; per_pax: boolean; }

function Quotes() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<(QuoteRow & { quote_versions: QuoteVersionRow[] })[] | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [f, setF] = useState({ customer_id: '', pax: '200', name: 'Paket Pernikahan Klasik', qty: '1', price: '55000', per_pax: true, discount: '0' });

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data: q, error }, { data: c }] = await Promise.all([
      sb.from('quotes').select('*,quote_versions(*)').eq('business_id', businessId).order('created_at', { ascending: false }).limit(50),
      sb.from('customers').select('*').eq('business_id', businessId).order('name').limit(100),
    ]);
    if (error) { setErr(error.message); return; }
    setRows((q ?? []) as unknown as (QuoteRow & { quote_versions: QuoteVersionRow[] })[]);
    setCustomers((c ?? []) as unknown as CustomerRow[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data quotation" />;

  async function create() {
    setErr(null);
    setBusy('new');
    try {
      await apiJson('/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: f.customer_id || null,
          pax: Number(f.pax),
          items: [{ name: f.name, qty: Number(f.qty), unit_price: Number(f.price), per_pax: f.per_pax }],
          discount: Number(f.discount) || 0,
        }),
      });
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal membuat quotation'); }
    finally { setBusy(''); }
  }

  async function approve(id: string) {
    setErr(null);
    setBusy(id);
    try {
      await apiJson(`/api/quotes/${id}/approve`, { method: 'POST' });
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal approve'); }
    finally { setBusy(''); }
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="card mb-3">
        <p className="font-semibold mb-2">Buat quotation (hitung di server)</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <select className="field" value={f.customer_id} onChange={(e) => setF({ ...f, customer_id: e.target.value })} aria-label="Customer">
            <option value="">— Tanpa customer —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="field" type="number" value={f.pax} onChange={(e) => setF({ ...f, pax: e.target.value })} placeholder="Pax" aria-label="Pax" />
          <input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nama item" aria-label="Nama item" />
          <input className="field" type="number" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} placeholder="Qty" aria-label="Qty" />
          <input className="field" type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="Harga satuan" aria-label="Harga satuan" />
          <input className="field" type="number" value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value })} placeholder="Diskon Rp" aria-label="Diskon" />
        </div>
        <Act tone="primary" onClick={create} disabled={busy === 'new'}>{busy === 'new' ? '…' : 'Buat DRAFT'}</Act>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? <Empty text="Belum ada quotation." /> : rows.map((q) => (
          <div key={q.id} className="card">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-semibold">{q.quote_no} · {rp(q.total)}</p>
              <span className="flex gap-1.5 items-center">
                <StatusPill status={q.status} />
                {['DRAFT', 'SENT', 'VIEWED', 'REVISION_REQUESTED'].includes(q.status) ? (
                  <Act tone="gold" disabled={busy === q.id} onClick={() => approve(q.id)}>{busy === q.id ? '…' : 'Approve'}</Act>
                ) : null}
              </span>
            </div>
            <div className="mt-2 text-[14px]">
              {(q.quote_versions ?? []).sort((a, b) => b.version - a.version).map((v) => (
                <p key={v.id} className="border-t border-line py-1.5 flex justify-between gap-2">
                  <span>V{v.version} · {v.pax} pax{v.change_summary ? ` · ${v.change_summary}` : ''}{v.approved_at ? ' · terkunci ✓' : ''}</span>
                  <b>{rp(v.total)}</b>
                </p>
              ))}
            </div>
            <p className="muted mt-1">Berlaku hingga {q.valid_until ? fmtDate(q.valid_until) : '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <CapabilityGate route="/quotations">
      <PageHeader title="Quotations" sub="Versioning: riwayat tak pernah ditimpa; versi approved terkunci." />
      <Section title="Daftar penawaran"><Quotes /></Section>
    </CapabilityGate>
  );
}
