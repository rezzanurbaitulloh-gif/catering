'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { canAccess } from '@/lib/capabilities';
import ModeSwitch from '@/components/ModeSwitch';

interface NavItem {
  href: string;
  label: string;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Utama',
    items: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/orders', label: 'Orders' },
      { href: '/events', label: 'Events' },
      { href: '/control', label: 'Control' },
      { href: '/risks', label: 'Risks' },
    ],
  },
  {
    title: 'Penjualan',
    items: [
      { href: '/leads', label: 'Leads/CRM' },
      { href: '/customers', label: 'Customers' },
      { href: '/quotations', label: 'Quotations' },
      { href: '/change-requests', label: 'Change Req.' },
      { href: '/packages', label: 'Packages' },
      { href: '/menu', label: 'Menu' },
    ],
  },
  {
    title: 'Operasi',
    items: [
      { href: '/production', label: 'Production' },
      { href: '/inventory', label: 'Inventory' },
      { href: '/procurement', label: 'Procurement' },
      { href: '/workforce', label: 'Workforce' },
      { href: '/vehicles', label: 'Vehicles' },
      { href: '/equipment', label: 'Equipment' },
      { href: '/venues', label: 'Venues' },
      { href: '/transport', label: 'Transport' },
    ],
  },
  {
    title: 'Keuangan & Lainnya',
    items: [
      { href: '/finance', label: 'Finance' },
      { href: '/incidents', label: 'Incidents' },
      { href: '/notifications', label: 'Notifikasi' },
      { href: '/analytics', label: 'Analytics' },
      { href: '/settings', label: 'Settings' },
    ],
  },
];

// Item bottom-nav mobile (5 terpenting operasional).
const TABS: NavItem[] = [
  { href: '/dashboard', label: 'Dash' },
  { href: '/orders', label: 'Order' },
  { href: '/events', label: 'Event' },
  { href: '/risks', label: 'Risiko' },
  { href: '/finance', label: 'Keu.' },
];

function active(href: string, path: string): boolean {
  return href === '/dashboard' ? path === '/dashboard' : path.startsWith(href);
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { businessId, isDemo, user } = useBusiness();
  const [caps, setCaps] = useState<Record<string, boolean>>({});
  const mountId = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    let alive = true;
    async function fetchCaps() {
      try {
        const sb = supabaseBrowser();
        const { data } = await sb
          .from('business_capabilities')
          .select('capability,enabled')
          .eq('business_id', businessId);
        if (!alive) return;
        const map: Record<string, boolean> = {};
        for (const r of (data ?? []) as { capability: string; enabled: boolean }[])
          map[r.capability] = r.enabled;
        setCaps(map);
      } catch {
        if (alive) setCaps({});
      }
    }
    fetchCaps();
    // Navigasi ikut berubah saat mode diubah dari web lain.
    const sb = supabaseBrowser();
    const ch = sb
      .channel(`nav-mode-sync-${mountId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'business_capabilities', filter: `business_id=eq.${businessId}` },
        () => fetchCaps()
      )
      .subscribe();
    window.addEventListener('focus', fetchCaps);
    return () => {
      alive = false;
      window.removeEventListener('focus', fetchCaps);
      sb.removeChannel(ch);
    };
  }, [businessId, mountId]);

  const visible = (href: string) => canAccess(href, caps);

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:sticky md:top-0 md:h-screen border-r border-line bg-paper px-4 py-5 overflow-y-auto">
        <Link href="/dashboard" className="mb-1">
          <p className="font-display text-[20px] leading-tight">Rasa Nusantara</p>
          <p className="muted">Pusat Komando</p>
        </Link>
        <div className="mt-2">
          <ModeSwitch />
        </div>
        {isDemo ? (
          <Link href="/login" className="btn-gold w-full mt-3 !min-h-[40px] !text-[14px]">
            Login untuk aksi penuh
          </Link>
        ) : (
          <p className="muted mt-3 truncate">{user?.email ?? 'Koordinator'}</p>
        )}
        <nav className="mt-4 flex flex-col gap-4">
          {GROUPS.map((g) => {
            const items = g.items.filter((i) => visible(i.href));
            if (items.length === 0) return null;
            return (
              <div key={g.title}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-1.5">
                  {g.title}
                </p>
                <div className="flex flex-col gap-0.5">
                  {items.map((i) => (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={`rounded-[10px] px-3 py-2 text-[15px] font-medium ${
                        active(i.href, path) ? 'bg-ink text-cream' : 'hover:bg-goldsoft'
                      }`}
                    >
                      {i.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        {!isDemo ? (
          <button onClick={logout} className="btn-ghost w-full mt-6">
            Keluar
          </button>
        ) : null}
      </aside>

      {/* Konten */}
      <div className="flex-1 min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden sticky top-0 z-10 bg-cream/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/dashboard" className="font-display text-[18px]">
            Rasa Nusantara
          </Link>
          <div className="flex items-center gap-2">
            <ModeSwitch compact />
            {isDemo ? (
            <Link href="/login" className="btn-gold !min-h-[36px] !px-3 !text-[13px]">
              Login
            </Link>
          ) : (
            <button onClick={logout} className="btn-ghost !min-h-[36px] !px-3 !text-[13px]">
              Keluar
            </button>
          )}
          </div>
        </header>
        <main className="px-4 pt-4 pb-24 md:px-8 md:pt-6 md:pb-10 max-w-6xl mx-auto">{children}</main>

        {/* Bottom nav mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 bg-paper border-t border-line px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-5 gap-0.5">
            {TABS.filter((t) => visible(t.href)).map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-[10px] py-2 text-center text-[12px] font-bold min-h-[44px] flex items-center justify-center ${
                  active(t.href, path) ? 'bg-ink text-cream' : 'text-ink'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
