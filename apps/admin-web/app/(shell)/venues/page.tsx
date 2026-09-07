'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, Loading, ErrorState, Empty, LoginRequired } from '@/components/ui';

function Ven() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<Array<{ id: string; name: string; address: string; contact_name: string | null; contact_phone: string | null; access_notes: string | null; parking_notes: string | null; power_notes: string | null; restrictions: string | null }> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from('venues').select('*').eq('business_id', businessId).order('name');
    if (error) { setErr(error.message); return; }
    setRows(data as never);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data venue" />;
  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {rows.length === 0 ? <Empty text="Belum ada venue." /> : rows.map((v) => (
        <div key={v.id} className="card">
          <p className="font-semibold text-[16px]">{v.name}</p>
          <p className="muted">{v.address}</p>
          <p className="text-[14px] mt-1">CP: {v.contact_name ?? '—'} {v.contact_phone ?? ''}</p>
          {v.access_notes ? <p className="text-[14px] mt-1"><b>Akses:</b> {v.access_notes}</p> : null}
          {v.parking_notes ? <p className="text-[14px]"><b>Parkir:</b> {v.parking_notes}</p> : null}
          {v.power_notes ? <p className="text-[14px]"><b>Listrik:</b> {v.power_notes}</p> : null}
          {v.restrictions ? <p className="text-[14px] text-danger"><b>Batasan:</b> {v.restrictions}</p> : null}
        </div>
      ))}
    </div>
  );
}

export default function VenuesPage() {
  return (
    <CapabilityGate route="/venues">
      <PageHeader title="Venues" sub="Akses, parkir, listrik, batasan — sumber kebenaran tim lapangan." />
      <Section title="Daftar venue"><Ven /></Section>
    </CapabilityGate>
  );
}
