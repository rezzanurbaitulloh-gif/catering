'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { PageHeader, Section, StatusPill, Loading, ErrorState, Empty, Act, LoginRequired } from '@/components/ui';

function Menu() {
  const { businessId, isDemo } = useBusiness();
  const [rows, setRows] = useState<Array<{ id: string; name: string; category: string; description: string | null; is_active: boolean }> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ name: '', category: 'Utama' });

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from('menu_items').select('*').eq('business_id', businessId).order('category').order('name');
    if (error) { setErr(error.message); return; }
    setRows(data as never);
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    if (f.name.trim().length < 2) { setErr('Nama menu wajib.'); return; }
    setErr(null);
    const { error } = await supabaseBrowser().from('menu_items').insert({ business_id: businessId, name: f.name.trim(), category: f.category, is_active: true });
    if (error) { setErr(error.message); return; }
    setF({ name: '', category: 'Utama' });
    load();
  }

  if (err && !rows) return <ErrorState text={err} retry={load} />;
  if (!rows) return <Loading />;

  const byCat = new Map<string, typeof rows>();
  for (const r of rows) byCat.set(r.category, [...(byCat.get(r.category) ?? []), r]);

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      {!isDemo ? (
        <div className="card mb-3 flex flex-wrap gap-2 items-end">
          <label className="block flex-1 min-w-40"><span className="muted text-[13px]">Nama menu</span><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="block"><span className="muted text-[13px]">Kategori</span>
            <select className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {['Pokok', 'Utama', 'Sup', 'Pelengkap', 'Dessert', 'Minuman'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <Act tone="primary" onClick={add}>Tambah</Act>
        </div>
      ) : null}
      {rows.length === 0 ? <Empty text="Belum ada menu." /> : Array.from(byCat.entries()).map(([cat, items]) => (
        <div key={cat} className="mb-3">
          <p className="h-section mb-1.5">{cat}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((m) => (
              <span key={m.id} className={`pill ${m.is_active ? 'bg-ink text-cream' : 'bg-line text-ink'}`} title={m.description ?? m.name}>
                {m.name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MenuPage() {
  return (
    <div>
      <PageHeader title="Menu" sub="Daftar hidangan penyusun paket & BOM dapur." />
      <Section title="Menu"><Menu /></Section>
    </div>
  );
}
