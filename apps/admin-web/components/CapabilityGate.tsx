'use client';

import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';
import { useBusiness } from '@/lib/session';
import { ROUTE_CAPABILITIES } from '@/lib/capabilities';
import { Loading } from './ui';

/**
 * Gerbang capability untuk route premium.
 * Capability hilang → notFound() (404, tanpa upsell) — sesuai ROUTE_CAPABILITIES.
 */
export default function CapabilityGate({
  route,
  children,
}: {
  route: string;
  children: React.ReactNode;
}) {
  const need = ROUTE_CAPABILITIES[route];
  const { businessId } = useBusiness();
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!need) {
        if (alive) setState('ok');
        return;
      }
      try {
        const sb = supabaseBrowser();
        const { data } = await sb
          .from('business_capabilities')
          .select('enabled')
          .eq('business_id', businessId)
          .eq('capability', need)
          .maybeSingle();
        if (!alive) return;
        setState((data as { enabled: boolean } | null)?.enabled ? 'ok' : 'missing');
      } catch {
        // Tanpa sesi (RLS menolak) → anggap hilang agar konsisten 404-aman.
        if (alive) setState('missing');
      }
    })();
    return () => {
      alive = false;
    };
  }, [businessId, need]);

  if (state === 'loading') return <Loading label="Memeriksa akses…" />;
  if (state === 'missing') notFound();
  return <>{children}</>;
}
