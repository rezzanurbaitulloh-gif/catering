'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { LeadMachine } from '@/lib/vendored-machines';
import { fmtDate } from '@/lib/format';
import type { LeadRow } from '@/lib/types';
import CapabilityGate from '@/components/CapabilityGate';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

function Leads() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<LeadRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', source: 'WhatsApp' });

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data, error } = await sb.from('leads').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as LeadRow[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);

  if (isDemo) return <LoginRequired what="Data leads" />;

  async function add() {
    if (form.name.trim().length < 2 || form.phone.trim().length < 6) { setErr('Nama & nomor HP wajib diisi.'); return; }
    setErr(null);
    const { error } = await supabaseBrowser().from('leads').insert({
      business_id: businessId, name: form.name.trim(), phone: form.phone.trim(), source: form.source, status: 'NEW',
    });
    if (error) { setErr(error.message); return; }
    setForm({ name: '', phone: '', source: 'WhatsApp' });
    load();
  }

  async function advance(id: string, from: string, to: string) {
    try { LeadMachine.assert(from, to); } catch { setErr(`Transisi ${from} → ${to} tidak valid`); return; }
    const { error } = await supabaseBrowser().from('leads').update({ status: to }).eq('id', id);
    if (error) { setErr(error.message); return; }
    load();
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="card mb-3">
        <p className="font-semibold mb-2">Tambah lead</p>
        <div className="flex flex-wrap gap-2">
          <input className="field !w-52" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" aria-label="Nama lead" />
          <input className="field !w-44" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="No. HP" inputMode="tel" aria-label="Nomor HP" />
          <select className="field !w-40" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} aria-label="Sumber">
            <option>WhatsApp</option><option>Instagram</option><option>Google</option><option>Referral</option><option>Lainnya</option>
          </select>
          <Act tone="primary" onClick={add}>Tambah</Act>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? <Empty text="Belum ada lead." /> : rows.map((l) => (
          <div key={l.id} className="rowcard">
            <div>
              <p className="font-semibold text-[15px]">{l.name} <span className="muted font-normal">· {l.phone} · {l.source ?? '—'}</span></p>
              <p className="muted">{l.event_type ?? '—'} · {l.estimated_pax ?? '—'} pax · {l.estimated_date ? fmtDate(l.estimated_date) : 'tanggal —'}</p>
            </div>
            <span className="flex items-center gap-1.5 flex-wrap justify-end">
              <StatusPill status={l.status} />
              {LeadMachine.next(l.status).map((n) => (
                <Act key={n} onClick={() => advance(l.id, l.status, n)}>→ {n}</Act>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <CapabilityGate route="/leads">
      <PageHeader title="Leads & CRM" sub="Pipeline: NEW → CONTACTED → QUALIFIED → WON/CONVERTED atau LOST." />
      <Section title="Daftar lead"><Leads /></Section>
    </CapabilityGate>
  );
}
