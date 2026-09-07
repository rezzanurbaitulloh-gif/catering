'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { apiJson } from '@/lib/api';
import { ProductionMachine } from '@/lib/vendored-machines';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

interface Plan {
  id: string; status: string; target_qty: number; actual_qty: number | null;
  events?: { event_no: string; title: string } | null;
  production_batches: Array<{ id: string; name: string; status: string; target_qty: number; actual_qty: number | null; waste_qty: number }>;
}

function Prod() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<Plan[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser()
      .from('production_plans')
      .select('id,status,target_qty,actual_qty,events(event_no,title),production_batches(id,name,status,target_qty,actual_qty,waste_qty)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as Plan[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Rencana produksi" />;

  async function adv(table: 'production_plans' | 'production_batches', id: string, to: string) {
    setErr(null); setBusy(id + to);
    try {
      await apiJson('/api/ops/production', { method: 'POST', body: JSON.stringify({ table, id, to }) });
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Gagal'); }
    finally { setBusy(''); }
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div className="flex flex-col gap-2">
      {err ? <p className="card border-danger/40 text-danger text-[14px]" role="alert">{err}</p> : null}
      {rows.length === 0 ? <Empty text="Belum ada rencana produksi." hint="Buat event & kunci pax dulu, lalu susun rencana." /> : rows.map((p) => (
        <div key={p.id} className="card">
          <div className="flex justify-between gap-2 flex-wrap">
            <p className="font-semibold">{p.events?.event_no ?? ''} · target {p.target_qty}{p.actual_qty != null ? ` · aktual ${p.actual_qty}` : ''}</p>
            <StatusPill status={p.status} />
          </div>
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            {ProductionMachine.next(p.status).map((n) => (
              <Act key={n} disabled={!!busy} onClick={() => adv('production_plans', p.id, n)}>{busy === p.id + n ? '…' : `→ ${n}`}</Act>
            ))}
          </div>
          {p.production_batches.map((b) => (
            <div key={b.id} className="mt-2 border-t border-line pt-2 flex justify-between gap-2 flex-wrap text-[14px]">
              <span>{b.name} · {b.target_qty}{b.actual_qty != null ? ` (aktual ${b.actual_qty})` : ''}{Number(b.waste_qty) > 0 ? ` · susut ${b.waste_qty}` : ''}</span>
              <span className="flex gap-1.5 items-center">
                <StatusPill status={b.status} />
                {ProductionMachine.next(b.status).map((n) => (
                  <Act key={n} disabled={!!busy} onClick={() => adv('production_batches', b.id, n)}>{busy === b.id + n ? '…' : `→ ${n}`}</Act>
                ))}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ProductionPage() {
  return (
    <CapabilityGate route="/production">
      <PageHeader title="Production" sub="Rencana → batch → QC. Target vs aktual & susut tercatat." />
      <Section title="Dapur & batch"><Prod /></Section>
    </CapabilityGate>
  );
}
