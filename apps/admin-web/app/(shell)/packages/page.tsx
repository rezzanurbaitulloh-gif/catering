'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { rp } from '@/lib/format';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

interface Pkg {
  id: string; name: string; description: string | null; base_price_per_pax: number;
  min_pax: number; max_pax: number | null; is_active: boolean;
  package_items: Array<{ name: string; qty_per_pax: number; unit: string }>;
  package_addons: Array<{ name: string; price: number; per_pax: boolean }>;
}

function Pkgs() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<Pkg[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', price: '', min_pax: '50' });

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser()
      .from('packages')
      .select('id,name,description,base_price_per_pax,min_pax,max_pax,is_active,package_items(name,qty_per_pax,unit),package_addons(name,price,per_pax)')
      .eq('business_id', businessId)
      .order('base_price_per_pax');
    if (error) { setErr(error.message); return; }
    setRows((data ?? []) as unknown as Pkg[]);
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (f.name.trim().length < 3 || !Number(f.price)) { setErr('Nama & harga wajib.'); return; }
    setErr(null);
    const { error } = await supabaseBrowser().from('packages').insert({
      business_id: businessId, name: f.name.trim(), base_price_per_pax: Number(f.price),
      min_pax: Number(f.min_pax) || 50, is_active: true,
    });
    if (error) { setErr(error.message); return; }
    setF({ name: '', price: '', min_pax: '50' });
    load();
  }

  async function toggle(id: string, cur: boolean) {
    const { error } = await supabaseBrowser().from('packages').update({ is_active: !cur }).eq('id', id);
    if (error) setErr(error.message);
    else load();
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      {!isDemo ? (
        <div className="card mb-3 flex flex-wrap gap-2 items-end">
          <label className="block flex-1 min-w-40"><span className="muted text-[13px]">Nama paket</span><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="block"><span className="muted text-[13px]">Harga/pax</span><input className="field !w-36" type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
          <label className="block"><span className="muted text-[13px]">Min pax</span><input className="field !w-28" type="number" value={f.min_pax} onChange={(e) => setF({ ...f, min_pax: e.target.value })} /></label>
          <Act tone="primary" onClick={add}>Tambah</Act>
        </div>
      ) : null}
      <div className="grid gap-2 md:grid-cols-2">
        {rows.length === 0 ? <Empty text="Belum ada paket." /> : rows.map((p) => (
          <div key={p.id} className="card">
            <div className="flex justify-between gap-2">
              <p className="font-semibold text-[16px]">{p.name}</p>
              <StatusPill status={p.is_active ? 'READY' : 'DROPPED'} />
            </div>
            <p className="font-display text-[20px] text-gold mt-0.5">{rp(p.base_price_per_pax)}<span className="text-[13px] muted">/pax · min {p.min_pax}</span></p>
            {p.description ? <p className="text-[14px] mt-1">{p.description}</p> : null}
            {p.package_items.length ? <p className="text-[13px] muted mt-1">Isi: {p.package_items.map((i) => `${i.name} ${i.qty_per_pax}${i.unit}`).join(' · ')}</p> : null}
            {p.package_addons.length ? <p className="text-[13px] muted">Add-on: {p.package_addons.map((a) => `${a.name} ${rp(a.price)}${a.per_pax ? '/pax' : ''}`).join(' · ')}</p> : null}
            {!isDemo ? <Act onClick={() => toggle(p.id, p.is_active)}>{p.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Act> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PackagesPage() {
  return (
    <div>
      <PageHeader title="Packages" sub="Katalog yang tampil di Customer Web." />
      <Section title="Paket katering"><Pkgs /></Section>
    </div>
  );
}
