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
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data, error }, { data: r }] = await Promise.all([
      sb.from('equipment').select('id,name,total_qty,condition').eq('business_id', businessId).order('name'),
      sb.from('equipment_reconciliation').select('id,assigned,loaded,returned,missing,damaged,note,equipment(name),events!inner(event_no)').order('reconciled_at', { ascending: false }).limit(30),
    ]);
    if (error) { setErr(error.message); return; }
    setEq((data ?? []) as unknown as Array<{ id: string; name: string; total_qty: number; condition: string }>);
    setRecon((r ?? []) as unknown as never);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data peralatan" />;
  if (err && !eq) return <ErrorState text={err} retry={load} />;
  if (!eq) return <Loading />;

  return (
    <div>
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
