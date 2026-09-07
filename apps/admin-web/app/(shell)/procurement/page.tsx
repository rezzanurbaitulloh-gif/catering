'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { rp } from '@/lib/format';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

interface PO {
  id: string; status: string; total: number;
  suppliers?: { name: string } | null;
  events?: { event_no: string } | null;
  purchase_order_items: Array<{ id: string; name: string; qty: number; unit: string; unit_price: number }>;
}

function Proc() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<PO[] | null>(null);
  const [sups, setSups] = useState<Array<{ id: string; name: string }>>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data, error }, { data: s }] = await Promise.all([
      sb.from('purchase_orders').select('id,status,total,suppliers(name),events(event_no),purchase_order_items(id,name,qty,unit,unit_price)').eq('business_id', businessId).order('created_at', { ascending: false }).limit(50),
      sb.from('suppliers').select('id,name').eq('business_id', businessId).order('name'),
    ]);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as PO[]);
    setSups((s ?? []) as unknown as Array<{ id: string; name: string }>);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data pengadaan" />;

  async function receive(po: PO) {
    setErr(null);
    const sb = supabaseBrowser();
    for (const it of po.purchase_order_items) {
      const { error } = await sb.from('receiving_records').insert({ po_id: po.id, received_qty: it.qty, note: `Terima ${it.name}` });
      if (error) { setErr(error.message); return; }
    }
    const { error } = await sb.from('purchase_orders').update({ status: 'RECEIVED' }).eq('id', po.id);
    if (error) { setErr(error.message); return; }
    load();
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="card mb-3">
        <p className="font-semibold">Supplier aktif ({sups.length})</p>
        <p className="muted">{sups.map((s) => s.name).join(' · ') || 'Belum ada supplier.'}</p>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? <Empty text="Belum ada purchase order." hint="PO terbit otomatis dari deteksi kekurangan bahan." /> : rows.map((p) => (
          <div key={p.id} className="card">
            <div className="flex justify-between gap-2 flex-wrap">
              <p className="font-semibold text-[15px]">{p.suppliers?.name ?? '—'} · {p.events?.event_no ?? ''} · {rp(p.total)}</p>
              <span className="flex gap-1.5 items-center"><StatusPill status={p.status} />
                {p.status === 'SENT' ? <Act tone="gold" onClick={() => receive(p)}>Terima barang</Act> : null}
              </span>
            </div>
            <ul className="mt-1.5 text-[14px]">
              {p.purchase_order_items.map((it) => (
                <li key={it.id} className="border-t border-line py-1 flex justify-between gap-2"><span>{it.name} · {it.qty} {it.unit}</span><span>{rp(it.unit_price)}/{it.unit}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProcurementPage() {
  return (
    <CapabilityGate route="/procurement">
      <PageHeader title="Procurement" sub="Kebutuhan → PO → terima. Kekurangan bahan terbit dari dapur." />
      <Section title="Pemasok & pesanan"><Proc /></Section>
    </CapabilityGate>
  );
}
