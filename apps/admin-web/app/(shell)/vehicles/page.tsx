'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, LoginRequired } from '@/components/ui';

function Veh() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<Array<{ id: string; name: string; plate: string | null; capacity_text: string | null; driver_name: string | null; status: string; vehicle_assignments: Array<{ events: { event_no: string } | null }> }> | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data, error } = await sb
      .from('vehicles')
      .select('id,name,plate,capacity_text,driver_name,status,vehicle_assignments(events(event_no))')
      .eq('business_id', businessId)
      .order('name');
    if (error) { setErr(error.message); return; }
    setRows(data as unknown as never);
    // Konflik tanggal-sama: armada yang sama dipakai 2 event di tanggal sama.
    const { data: asg } = await sb
      .from('vehicle_assignments')
      .select('vehicle_id,vehicles!inner(name),events!inner(event_no,event_date)')
      .eq('business_id', businessId);
    const seen = new Map<string, string>();
    const msgs: string[] = [];
    for (const a of ((asg ?? []) as unknown as Array<{ vehicle_id: string; vehicles: { name: string }; events: { event_no: string; event_date: string } }>)) {
      const key = `${a.vehicle_id}|${a.events.event_date}`;
      const prev = seen.get(key);
      if (prev && prev !== a.events.event_no) {
        msgs.push(`${a.vehicles.name} dipakai ganda ${a.events.event_date}: ${prev} × ${a.events.event_no}`);
      } else {
        seen.set(key, a.events.event_no);
      }
    }
    setConflicts(msgs);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data armada" />;
  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div className="flex flex-col gap-2">
      {conflicts.length > 0 ? (
        <div className="card border-danger/40" role="alert">
          <p className="font-bold text-danger">Konflik armada ({conflicts.length})</p>
          {conflicts.map((c, i) => <p key={i} className="text-[14px]">{c}</p>)}
        </div>
      ) : null}
      {rows.length === 0 ? <Empty text="Belum ada armada." /> : rows.map((v) => (
        <div key={v.id} className="rowcard">
          <div>
            <p className="font-semibold text-[15px]">{v.name} <span className="muted font-normal">· {v.plate ?? '—'} · {v.capacity_text ?? ''}</span></p>
            <p className="muted">Sopir: {v.driver_name ?? '—'} · dipakai: {v.vehicle_assignments.map((a) => a.events?.event_no).filter(Boolean).join(', ') || '—'}</p>
          </div>
          <StatusPill status={v.status} />
        </div>
      ))}
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <CapabilityGate route="/vehicles">
      <PageHeader title="Vehicles" sub="Armada, sopir, dan pemakaian per event." />
      <Section title="Armada"><Veh /></Section>
    </CapabilityGate>
  );
}
