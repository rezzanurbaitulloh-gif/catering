'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { DEMO_BUSINESS_ID, supabaseBrowser } from './supabase';

export interface BusinessCtx {
  user: User | null;
  businessId: string;
  /** true bila belum login — baca publik saja, mutasi dinonaktifkan. */
  isDemo: boolean;
  loading: boolean;
  refresh: () => void;
}

/** Sesi + business aktif. Login → business dari profil; tanpa sesi → business demo (read-only). */
export function useBusiness(): BusinessCtx {
  const [user, setUser] = useState<User | null>(null);
  const [businessId, setBusinessId] = useState<string>(DEMO_BUSINESS_ID);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const sb = supabaseBrowser();
        const { data } = await sb.auth.getSession();
        const sess: Session | null = data.session;
        if (!alive) return;
        setUser(sess?.user ?? null);
        if (sess?.user) {
          const { data: prof } = await sb
            .from('profiles')
            .select('business_id')
            .eq('id', sess.user.id)
            .maybeSingle();
          const bid = (prof as { business_id: string | null } | null)?.business_id;
          setBusinessId(bid ?? DEMO_BUSINESS_ID);
        } else {
          setBusinessId(DEMO_BUSINESS_ID);
        }
      } catch {
        if (alive) {
          setUser(null);
          setBusinessId(DEMO_BUSINESS_ID);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  return { user, businessId, isDemo: user == null, loading, refresh };
}
