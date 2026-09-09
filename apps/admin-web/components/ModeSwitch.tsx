'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { PREMIUM_CAPABILITIES, detectMode, type ProductMode } from '@/lib/capabilities';

// Saklar mode di header: tampil di semua halaman admin.
// Menulis business_capabilities (RLS member) lalu refresh agar nav menyesuaikan.
export default function ModeSwitch({ compact = false }: { compact?: boolean }) {
  const { businessId, isDemo } = useBusiness();
  const router = useRouter();
  const mountId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [caps, setCaps] = useState<Array<{ capability: string; enabled: boolean }>>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await supabaseBrowser()
        .from('business_capabilities')
        .select('capability,enabled')
        .eq('business_id', businessId);
      setCaps((data ?? []) as Array<{ capability: string; enabled: boolean }>);
    } catch {
      setCaps([]);
    }
  }, [businessId]);

  useEffect(() => {
    if (isDemo) return;
    load();
    // Ikut berubah saat mode diubah dari web lain (realtime + fokus).
    // Nama channel unik per mount: channel() mengembalikan instance sama untuk
    // nama sama, dan .on() setelah subscribe melempar error (StrictMode!).
    const sb = supabaseBrowser();
    const ch = sb
      .channel(`mode-sync-${mountId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'business_capabilities', filter: `business_id=eq.${businessId}` },
        () => load()
      )
      .subscribe();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      sb.removeChannel(ch);
    };
  }, [isDemo, load, businessId, mountId]);

  if (isDemo) {
    return (
      <Link
        href="/login"
        title="Login untuk ubah mode produk"
        className={`rounded-full border border-line bg-paper font-bold text-muted ${
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[13px]'
        }`}
      >
        Demo
      </Link>
    );
  }

  const mode: ProductMode = caps.length ? detectMode(caps) : 'BASIC';
  const label = mode === 'PREMIUM' ? '✦ Premium' : mode === 'BASIC' ? 'Basic' : 'Custom';

  async function setMode(premium: boolean) {
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      for (const cap of PREMIUM_CAPABILITIES) {
        const { error } = await sb
          .from('business_capabilities')
          .upsert({ business_id: businessId, capability: cap, enabled: premium }, { onConflict: 'business_id,capability' });
        if (error) throw new Error(`Gagal pada ${cap}`);
      }
      await load();
      setOpen(false);
      router.refresh();
    } catch {
      await load();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Ubah mode produk (Basic/Premium)"
        aria-expanded={open}
        className={`rounded-full border font-bold ${
          mode === 'PREMIUM'
            ? 'border-gold bg-gold text-white'
            : mode === 'CUSTOM'
              ? 'border-gold bg-goldsoft text-ink'
              : 'border-line bg-paper text-ink'
        } ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[13px]'}`}
      >
        {label} ▾
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-56 card !p-2" role="menu">
          <p className="muted px-2 pt-1 text-[12px]">Mode produk — berlaku seketika di semua aplikasi.</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => setMode(false)}
            className="mt-1 w-full rounded-[10px] px-3 py-2.5 text-left hover:bg-cream disabled:opacity-60"
            role="menuitem"
          >
            <span className="block font-bold text-[14px]">Basic {mode === 'BASIC' ? '✓' : ''}</span>
            <span className="muted block text-[12px]">Operasional dasar saja.</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setMode(true)}
            className="w-full rounded-[10px] px-3 py-2.5 text-left hover:bg-cream disabled:opacity-60"
            role="menuitem"
          >
            <span className="block font-bold text-[14px]">✦ Premium {mode === 'PREMIUM' ? '✓' : ''}</span>
            <span className="muted block text-[12px]">Seluruh modul canggih menyala.</span>
          </button>
          <Link href="/settings" onClick={() => setOpen(false)} className="text-gold block px-3 py-2 text-[13px] font-semibold">
            Atur per-modul di Settings →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
