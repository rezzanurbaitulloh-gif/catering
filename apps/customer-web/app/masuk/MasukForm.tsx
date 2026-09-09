"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

// Masuk pelanggan (Supabase Auth). Sesi dipakai dashboard, checkout, invoice.
export default function MasukForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErr("Isi alamat email yang valid.");
      return;
    }
    if (!password) {
      setErr("Isi kata sandi.");
      return;
    }
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setErr("Layanan belum terkonfigurasi.");
        return;
      }
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.push("/akun");
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Gagal masuk. Periksa email & sandi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="m-email" className="label">Email</label>
        <input id="m-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@email.id" />
      </div>
      <div>
        <label htmlFor="m-pass" className="label">Kata sandi</label>
        <input id="m-pass" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" />
      </div>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <button type="submit" className="btn-gold w-full" disabled={busy}>
        {busy ? "Memeriksa…" : "Masuk"}
      </button>
      <p className="flex justify-between text-sm">
        <Link href="/daftar" className="font-bold text-gold-deep underline">Belum punya akun? Daftar</Link>
        <Link href="/lupa-password" className="font-bold text-gold-deep underline">Lupa sandi</Link>
      </p>
    </form>
  );
}
