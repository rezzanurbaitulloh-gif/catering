'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { BASIC_CAPABILITIES, PREMIUM_CAPABILITIES, detectMode } from '@/lib/capabilities';
import { PageHeader, Section, Loading, ErrorState, Act, LoginRequired, StatusPill } from '@/components/ui';

function Settings() {
  const { businessId, isDemo } = useBusiness();
  const [s, setS] = useState<Record<string, string> | null>(null);
  const [caps, setCaps] = useState<Array<{ capability: string; enabled: boolean }>>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState('');

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [{ data: st, error }, { data: c }] = await Promise.all([
      sb.from('business_settings').select('*').eq('business_id', businessId).maybeSingle(),
      sb.from('business_capabilities').select('capability,enabled').eq('business_id', businessId).order('capability'),
    ]);
    if (error) { setErr(error.message); return; }
    const row = (st ?? {}) as Record<string, unknown>;
    setS({
      name: '', address: String(row.address ?? ''), phone: String(row.phone ?? ''),
      whatsapp: String(row.whatsapp ?? ''), email: String(row.email ?? ''),
    });
    const { data: biz } = await sb.from('businesses').select('name').eq('id', businessId).maybeSingle();
    setS((prev) => ({ ...(prev ?? {}), name: String((biz as { name?: string } | null)?.name ?? '') }));
    setCaps((c ?? []) as unknown as Array<{ capability: string; enabled: boolean }>);
  }, [businessId]);

  useEffect(() => { if (!isDemo) load(); }, [isDemo, load]);
  if (isDemo) return <LoginRequired what="Pengaturan usaha" />;

  async function save() {
    if (!s) return;
    setErr(null); setSaved('');
    const sb = supabaseBrowser();
    const { error: bErr } = await sb.from('businesses').update({ name: s.name }).eq('id', businessId);
    const { error: sErr } = await sb.from('business_settings').upsert({
      business_id: businessId, address: s.address, phone: s.phone,
      whatsapp: s.whatsapp, email: s.email,
    }, { onConflict: 'business_id' });
    if (bErr || sErr) { setErr(bErr?.message ?? sErr?.message ?? 'Gagal'); return; }
    setSaved('Tersimpan ✓');
  }

  async function toggle(cap: string, cur: boolean) {
    const { error } = await supabaseBrowser()
      .from('business_capabilities')
      .update({ enabled: !cur })
      .eq('business_id', businessId)
      .eq('capability', cap);
    if (error) setErr(error.message);
    else load();
  }

  // Saklar mode satu-ketuk: Basic = semua premium mati; Premium = semua menyala.
  async function setMode(premium: boolean) {
    setErr(null); setSaved('');
    const sb = supabaseBrowser();
    for (const cap of PREMIUM_CAPABILITIES) {
      const { error } = await sb
        .from('business_capabilities')
        .upsert({ business_id: businessId, capability: cap, enabled: premium }, { onConflict: 'business_id,capability' });
      if (error) { setErr(`Gagal pada ${cap}: ${error.message}`); break; }
    }
    await load();
    setSaved(premium ? 'Mode PREMIUM aktif — semua modul terbuka.' : 'Mode BASIC aktif — hanya modul dasar.');
  }

  if (err && !s) return <ErrorState text={err} retry={load} />;
  if (!s) return <Loading />;

  const basic = caps.filter((c) => (BASIC_CAPABILITIES as readonly string[]).includes(c.capability));
  const premium = caps.filter((c) => (PREMIUM_CAPABILITIES as readonly string[]).includes(c.capability));
  const mode = detectMode(caps);

  return (
    <div>
      {err ? <p className="card border-danger/40 text-danger mb-3 text-[14px]" role="alert">{err}</p> : null}
      {saved ? <p className="card border-leaf/40 text-leaf mb-3 text-[14px]" role="status">{saved}</p> : null}
      <div className="card mb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-semibold">Mode produk saat ini</p>
          <StatusPill status={mode === 'PREMIUM' ? 'READY' : mode === 'BASIC' ? 'PLANNED' : 'MEDIUM'} />
        </div>
        <p className="muted mt-1">
          {mode === 'PREMIUM' ? 'Premium — seluruh modul canggih menyala.' : mode === 'BASIC' ? 'Basic — operasional dasar saja (ritme harian tetap jalan).' : 'Campuran — sebagian modul premium menyala.'}
        </p>
        <div className="mt-2 flex gap-2 flex-wrap">
          <Act tone={mode === 'BASIC' ? 'primary' : 'ghost'} onClick={() => setMode(false)}>Mode Basic</Act>
          <Act tone={mode === 'PREMIUM' ? 'primary' : 'gold'} onClick={() => setMode(true)}>Mode Premium</Act>
        </div>
        <p className="muted mt-2 text-[13px]">Mematikan premium menyembunyikan rute, navigasi, dan aksi di SEMUA aplikasi — server ikut menolak. Data tidak dihapus, tinggal nyalakan lagi.</p>
      </div>
      <div className="card mb-3">
        <p className="font-semibold mb-2">Identitas usaha</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[['name', 'Nama usaha'], ['address', 'Alamat'], ['phone', 'Telepon'], ['whatsapp', 'WhatsApp'], ['email', 'Email']].map(([k, label]) => (
            <label key={k} className="block">
              <span className="muted text-[13px]">{label}</span>
              <input className="field" value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <Act tone="primary" onClick={save}>Simpan</Act>
      </div>
      <div className="card">
        <p className="font-semibold">Kapabilitas Basic ({basic.filter((c) => c.enabled).length}/{basic.length} aktif)</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {basic.map((c) => (
            <button key={c.capability} onClick={() => toggle(c.capability, c.enabled)} className={`pill cursor-pointer ${c.enabled ? 'bg-ink text-cream' : 'bg-line text-ink'}`} title="Ketuk untuk ubah">
              {c.capability}
            </button>
          ))}
        </div>
        <p className="font-semibold mt-3">Kapabilitas Premium ({premium.filter((c) => c.enabled).length}/{premium.length} aktif)</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {premium.map((c) => (
            <button key={c.capability} onClick={() => toggle(c.capability, c.enabled)} className={`pill cursor-pointer ${c.enabled ? 'bg-gold text-white' : 'bg-line text-ink'}`} title="Ketuk untuk ubah">
              {c.capability}
            </button>
          ))}
        </div>
        <p className="muted mt-2 text-[13px]">Menonaktifkan kapabilitas menyembunyikan rute & aksi di semua aplikasi (server ikut menolak).</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" sub="Identitas usaha & kapabilitas Basic/Premium." />
      <Section title="Pengaturan"><Settings /></Section>
    </div>
  );
}
