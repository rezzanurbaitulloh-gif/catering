import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

// Helper khusus API routes (server). Klien user-scoped → RLS tetap berlaku.
// Token diambil dari header Authorization: Bearer <jwt> yang dikirim lib/api.ts.
// Header anti-cache: baca selalu segar (pernah ada bacaan basi di jalur edge).
const NO_CACHE = { global: { headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } } } as const;

function baseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    NO_CACHE,
  );
}

function bearerFrom(req: Request): string | null {
  const h = req.headers.get('authorization');
  if (h?.startsWith('Bearer ')) return h.slice(7);
  // Fallback: cookie sesi supabase (bila deployment memakai persistensi cookie)
  const cookie = req.headers.get('cookie') ?? '';
  const m = cookie.match(/sb-[^-]+-auth-token=([^;]+)/);
  if (m) {
    try {
      const parsed = JSON.parse(decodeURIComponent(m[1]));
      const token = parsed?.access_token ?? parsed?.[0]?.access_token;
      if (typeof token === 'string') return token;
    } catch {
      return null;
    }
  }
  return null;
}

export interface Authed {
  supabase: SupabaseClient;
  user: User;
  businessId: string;
}

/** Gagal → throw Response 401/403/500 (ditangkap handler jadi JSON). */
export async function requireAuth(req: Request): Promise<Authed> {
  const token = bearerFrom(req);
  if (!token) throw json(401, 'Login diperlukan');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    { global: { headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache", Pragma: "no-cache" } } },
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw json(401, 'Sesi tidak valid — silakan login ulang');
  const { data: prof } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', data.user.id)
    .maybeSingle();
  const businessId = (prof as { business_id: string | null } | null)?.business_id;
  if (!businessId) throw json(403, 'Akun belum terhubung ke business');
  return { supabase, user: data.user, businessId };
}

/** Capability premium dicek ulang di server; hilang → 404 (tanpa upsell). */
export async function requireCap(
  supabase: SupabaseClient,
  businessId: string,
  capability: string,
): Promise<void> {
  const { data } = await supabase
    .from('business_capabilities')
    .select('enabled')
    .eq('business_id', businessId)
    .eq('capability', capability)
    .maybeSingle();
  if (!(data as { enabled: boolean } | null)?.enabled) throw json(404, 'Tidak ditemukan');
}

export function json(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export { baseClient };
