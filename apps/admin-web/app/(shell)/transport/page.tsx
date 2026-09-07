'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { fmtDateTime } from '@/lib/format';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

interface T { id: string; kind: string; status: string; departed_at: string | null; eta_at: string | null; arrived_at: string | null; receiver_name: string | null; note: string | null; events?: { event_no: string } | null }

function Trans() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<T[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser()
      .from('transport_tasks')
      .select('id,kind,status,departed_at,eta_at,arrived_at,receiver_name,note,events!inner(event_no)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as T[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Tugas transport" />;

  async function stamp(id: string, field: 'departed_at' | 'arrived_at') {
    const { error } = await supabaseBrowser().from('transport_tasks').update({ [field]: new Date().toISOString(), status: field === 'arrived_at' ? 'ARRIVED' : 'DEPARTED' }).eq('id', id);
    if (error) setErr(error.message);
    else load();
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div className="flex flex-col gap-2">
      {err ? <p className="card border-danger/40 text-danger text-[14px]" role="alert">{err}</p> : null}
      {rows.length === 0 ? <Empty text="Belum ada tugas transport." /> : rows.map((t) => (
        <div key={t.id} className="card">
          <div className="flex justify-between gap-2 flex-wrap">
            <p className="font-semibold">{t.events?.event_no} · {t.kind}</p>
            <StatusPill status={t.status} />
          </div>
          <p className="muted text-[14px] mt-1">Berangkat {fmtDateTime(t.departed_at)} · ETA {fmtDateTime(t.eta_at)} · Tiba {fmtDateTime(t.arrived_at)}</p>
          {t.receiver_name ? <p className="text-[14px]">Penerima: {t.receiver_name}</p> : null}
          <div className="mt-2 flex gap-1.5">
            {!t.departed_at ? <Act tone="gold" onClick={() => stamp(t.id, 'departed_at')}>Catat berangkat</Act> : null}
            {t.departed_at && !t.arrived_at ? <Act tone="gold" onClick={() => stamp(t.id, 'arrived_at')}>Catat tiba</Act> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TransportPage() {
  return (
    <CapabilityGate route="/transport">
      <PageHeader title="Transport" sub="Milestone berstempel waktu: berangkat → ETA → tiba + penerima." />
      <Section title="Pengiriman"><Trans /></Section>
    </CapabilityGate>
  );
}
