'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser, isMissingEnv } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loginWith(e: string, p: string) {
    setErr(null);
    setBusy(true);
    try {
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email: e, password: p });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Login gagal');
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await loginWith(email, password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm">
        <p className="font-display text-[26px]">Rasa Nusantara</p>
        <p className="muted mt-1">Masuk ke Pusat Komando (koordinator & tim).</p>
        {isMissingEnv() ? (
          <p className="mt-3 text-danger text-[14px]">
            ENV belum diisi — salin .env.example ke .env.local lalu isi kredensial Supabase.
          </p>
        ) : null}
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="koordinator@rasanusantara.id" />
          </div>
          <div>
            <label className="label" htmlFor="pw">Kata sandi</label>
            <input id="pw" className="input" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {err ? <p className="text-danger text-[14px]">{err}</p> : null}
          <button className="btn-gold w-full" disabled={busy}>
            {busy ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
        <div className="mt-4 border-t border-line pt-3">
          <p className="font-semibold text-[14px]">Akun demo — ketuk untuk isi otomatis</p>
          <div className="mt-2 grid gap-2">
            {[
              { label: 'Admin (pemilik)', email: 'admin@rasanusantara.id', password: 'AdminRasa2026!' },
              { label: 'Tim (operasional)', email: 'tim@rasanusantara.id', password: 'TimRasa2026!' },
            ].map((a) => (
              <button
                key={a.email}
                type="button"
                disabled={busy}
                onClick={() => { setEmail(a.email); setPassword(a.password); loginWith(a.email, a.password); }}
                className="rounded-[10px] border border-line bg-cream px-3 py-2.5 text-left hover:border-gold"
              >
                <span className="block font-bold text-[14px]">{a.label}</span>
                <span className="block text-[13px] muted font-mono">{a.email} · {a.password}</span>
              </button>
            ))}
          </div>
          <p className="muted mt-2 text-[12px]">Kredensial demo untuk uji coba — ganti setelah serah terima.</p>
        </div>
        <div className="mt-3 text-center">
          <Link href="/dashboard" className="text-gold font-semibold text-[14px]">
            Lanjut tanpa login (mode demo, read-only)
          </Link>
        </div>
      </div>
    </div>
  );
}
