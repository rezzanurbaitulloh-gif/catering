'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { rp, fmtDate } from '@/lib/format';
import type { CustomerRow } from '@/lib/types';
import { PageHeader, Section, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

function Cust() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', phone: '' });

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from('customers').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(200);
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as CustomerRow[]);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Data pelanggan" />;

  async function add() {
    if (f.name.trim().length < 2 || f.phone.trim().length < 6) { setErr('Nama & nomor HP wajib.'); return; }
    setErr(null);
    const { error } = await supabaseBrowser().from('customers').insert({ business_id: businessId, name: f.name.trim(), phone: f.phone.trim() });
    if (error) { setErr(error.message); return; }
    setF({ name: '', phone: '' });
    load();
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      <div className="card mb-3 flex flex-wrap gap-2 items-end">
        <label className="block"><span className="muted text-[13px]">Nama</span><input className="field !w-52" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="block"><span className="muted text-[13px]">No. HP</span><input className="field !w-44" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" /></label>
        <Act tone="primary" onClick={add}>Tambah</Act>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length === 0 ? <Empty text="Belum ada pelanggan." /> : rows.map((c) => (
          <div key={c.id} className="rowcard">
            <div>
              <p className="font-semibold text-[15px]">{c.name} <span className="muted font-normal">· {c.phone}{c.source ? ` · ${c.source}` : ''}</span></p>
              <p className="muted">{c.event_count} event · total {rp(c.total_spent)}{c.last_event_at ? ` · terakhir ${fmtDate(c.last_event_at)}` : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" sub="Pelanggan, riwayat event, dan total belanja." />
      <Section title="Daftar pelanggan"><Cust /></Section>
    </div>
  );
}
