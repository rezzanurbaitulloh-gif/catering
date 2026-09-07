import { supabaseBrowser } from './supabase';

/** fetch wrapper ke API route lokal; otomatis melampirkan Bearer token sesi (untuk RLS server). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const sb = supabaseBrowser();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers ?? {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(path, { ...init, headers });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: string }).error ?? `Permintaan gagal (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}
