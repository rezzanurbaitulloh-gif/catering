"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";

export interface CustomerMe {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface AuthCtx {
  session: Session | null;
  user: User | null;
  customer: CustomerMe | null;
  loading: boolean;
  refresh: () => void;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null, user: null, customer: null, loading: true,
  refresh: () => {}, signOut: async () => {},
});

export function useCustomerAuth(): AuthCtx {
  return useContext(Ctx);
}

// Sesi pelanggan: Supabase Auth + baris customers milik sendiri (RLS).
// Identitas checkout SELALU dari sesi, tidak pernah dari input browser.
export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<CustomerMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const sb = supabaseBrowser();
        if (!sb) {
          if (alive) { setSession(null); setCustomer(null); setLoading(false); }
          return;
        }
        const { data } = await sb.auth.getSession();
        if (!alive) return;
        setSession(data.session);
        if (data.session?.user) {
          const { data: c } = await sb
            .from("customers")
            .select("id,business_id,name,phone,email")
            .eq("auth_user_id", data.session.user.id)
            .maybeSingle();
          if (alive) setCustomer((c as CustomerMe | null) ?? null);
        } else if (alive) {
          setCustomer(null);
        }
      } catch {
        if (alive) { setSession(null); setCustomer(null); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  useEffect(() => {
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data: sub } = sb.auth.onAuthStateChange(() => refresh());
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  async function signOut() {
    await supabaseBrowser()?.auth.signOut();
    setSession(null);
    setCustomer(null);
  }

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, customer, loading, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
