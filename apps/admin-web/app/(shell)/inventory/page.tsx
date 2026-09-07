'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

interface Inv {
  id: string; sku: string; unit: string; stock: number; reserved: number; min_stock: number;
  ingredients: { name: string } | null;
}

function Inven() {
  const { businessId, isDemo, user } = useBusiness();
  const [rows, setRows] = useState<Inv[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [adj, setAdj] = useState({ id: '', qty: '', note: '' });

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser()
      .from('inventory_items')
      .select('id,sku,unit,stock,reserved,min_stock,ingredients(name)')
      .eq('business_id', businessId)
      .order('sku');
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as Inv[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data stok" />;

  async function adjust() {
    const qty = Number(adj.qty);
    if (!adj.id || !Number.isFinite(qty) || qty === 0) { setErr('Pilih item & isi koreksi bukan nol.'); return; }
    setErr(null);
    const sb = supabaseBrowser();
    const cur = rows?.find((r) => r.id === adj.id);
    if (!cur) return;
    const next = Number(cur.stock) + qty;
    if (next < 0) { setErr('Stok tidak boleh negatif.'); return; }
    const { error: tErr } = await sb.from('inventory_transactions').insert({
      business_id: businessId, inventory_item_id: adj.id, kind: 'ADJUSTMENT', qty,
      note: adj.note || 'Koreksi manual', created_by: user?.id ?? null,
    });
    if (tErr) { setErr(tErr.message); return; }
    const { error: uErr } = await sb.from('inventory_items').update({ stock: next }).eq('id', adj.id);
    if (uErr) { setErr(uErr.message); return; }
    setAdj({ id: '', qty: '', note: '' });
    load();
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? <Empty text="Stok kosong." /> : rows.map((r) => {
          const avail = Number(r.stock) - Number(r.reserved);
          const low = avail <= Number(r.min_stock);
          return (
            <div key={r.id} className="rowcard">
              <div>
                <p className="font-semibold text-[15px]">{r.ingredients?.name ?? r.sku} <span className="muted font-normal">· {r.sku}</span></p>
                <p className="muted">Stok {r.stock} · dicadangkan {r.reserved} · tersedia <b className={low ? 'text-danger' : ''}>{avail}</b> {r.unit} · min {r.min_stock}</p>
              </div>
              {low ? <StatusPill status="LOW" /> : <StatusPill status="READY" />}
            </div>
          );
        })}
      </div>
      <div className="card mt-3">
        <p className="font-semibold mb-2">Koreksi stok (tercatat di transaksi + audit)</p>
        <div className="flex flex-wrap gap-2">
          <select className="field !w-52" value={adj.id} onChange={(e) => setAdj({ ...adj, id: e.target.value })} aria-label="Item">
            <option value="">— Pilih item —</option>
            {rows.map((r) => <option key={r.id} value={r.id}>{r.ingredients?.name ?? r.sku}</option>)}
          </select>
          <input className="field !w-32" type="number" value={adj.qty} onChange={(e) => setAdj({ ...adj, qty: e.target.value })} placeholder="+/- qty" aria-label="Koreksi qty" />
          <input className="field !w-52" value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} placeholder="Alasan" aria-label="Alasan" />
          <Act tone="primary" onClick={adjust}>Simpan</Act>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <CapabilityGate route="/inventory">
      <PageHeader title="Inventory" sub="Stok − cadangan = tersedia. Di bawah minimum = segera adakan." />
      <Section title="Stok bahan"><Inven /></Section>
    </CapabilityGate>
  );
}
