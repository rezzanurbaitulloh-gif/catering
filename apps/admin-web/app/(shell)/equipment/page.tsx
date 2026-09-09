'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, Loading, ErrorState, Empty, LoginRequired } from '@/components/ui';

function Eq() {
  const { businessId, isDemo } = useBusiness();
  const [eq, setEq] = useState<Array<{ id: string; name: string; total_qty: number; condition: string }> | null>(null);
  const [recon, setRecon] = useState<Array<{ id: string; assigned: number; loaded: number; returned: number; missing: number; damaged: number; note: string | null; equipment: { name: string } | null; events: { event_no: string } | null }>>([]);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data, error }, { data: r }, { data: asg }] = await Promise.all([
      sb.from('equipment').select('id,name,total_qty,condition').eq('business_id', businessId).order('name'),
      sb.from('equipment_reconciliation').select('id,assigned,loaded,returned,missing,damaged,note,equipment(name),events!inner(event_no)').order('reconciled_at', { ascending: false }).limit(30),
      sb.from('equipment_assignments').select('equipment_id,qty,equipment!inner(name),events!inner(event_no,event_date)').eq('business_id', businessId),
    ]);
    if (error) { setErr(error.message); return; }
    setEq(((data ?? []) as unknown) as Array<{ id: string; name: string; total_qty: number; condition: string }>);
    setRecon((r ?? []) as unknown as never);
    // Konflik: total pemakaian per tanggal melebihi stok.
    const use = new Map<string, { name: string; qty: number; evts: string[] }>();
    for (const a of ((asg ?? []) as unknown as Array<{ equipment_id: string; qty: number; equipment: { name: string }; events: { event_no: string; event_date: string } }>)) {
      const key = `${a.equipment_id}|${a.events.event_date}`;
      const cur = use.get(key) ?? { name: a.equipment.name, qty: 0, evts: [] };
      cur.qty += a.qty;
      cur.evts.push(a.events.event_no);
      use.set(key, cur);
    }
    const stock = new Map(((data ?? []) as Array<{ id: string; total_qty: number }>).map((e) => [e.id, e.total_qty]));
    const msgs: string[] = [];
    for (const [key, u] of use) {
      const [eid, date] = key.split('|');
      const avail = stock.get(eid) ?? 0;
      if (u.qty > avail) msgs.push(`${u.name}: butuh ${u.qty}, stok ${avail} (${date}: ${u.evts.join(' × ')})`);
    }
    setConflicts(msgs);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data peralatan" />;
  if (err && !eq) return <ErrorState text={err} retry={load} />;
  if (!eq) return <Loading />;

  return (
    <div>
      {conflicts.length > 0 ? (
        <div className="card border-danger/40 mb-3" role="alert">
          <p className="font-bold text-danger">Konflik peralatan ({conflicts.length})</p>
          {conflicts.map((c, i) => <p key={i} className="text-[14px]">{c}</p>)}
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2 mb-3">
        {eq.length === 0 ? <Empty text="Belum ada peralatan." /> : eq.map((e) => (
          <div key={e.id} className="card">
            <p className="font-semibold">{e.name}</p>
            <p className="muted">Stok {e.total_qty} · kondisi {e.condition}</p>
          </div>
        ))}
      </div>
      <p className="h-section mb-2">Rekonsiliasi terakhir</p>
      <div className="flex flex-col gap-2">
        {recon.length === 0 ? <Empty text="Belum ada rekonsiliasi." /> : recon.map((r) => (
          <div key={r.id} className="rowcard">
            <div>
              <p className="font-semibold text-[15px]">{r.equipment?.name} · {r.events?.event_no}</p>
              <p className="muted">dibawa {r.assigned} · dimuat {r.loaded} · kembali {r.returned}{r.note ? ` · ${r.note}` : ''}</p>
            </div>
            <b className={r.missing > 0 ? 'text-danger' : 'text-leaf'}>{r.missing > 0 ? `HILANG ${r.missing}` : 'Lengkap ✓'}{r.damaged ? ` · rusak ${r.damaged}` : ''}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EquipmentPage() {
  return (
    <CapabilityGate route="/equipment">
      <PageHeader title="Equipment" sub="Dibawa vs kembali — selisih selalu terlihat." />
      <Section title="Peralatan"><Eq /></Section>
    </CapabilityGate>
  );
}
