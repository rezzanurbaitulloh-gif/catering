"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BUSINESS_ID } from "@/lib/constants";
import { supabaseBrowser } from "@/lib/supabase-browser";

// Pendaftaran: Auth user + baris customers terhubung (auth_user_id).
// Nomor HP dipakai menautkan riwayat lama (klaim saat checkout).
export default function DaftarForm() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (nama.trim().length < 3) return setErr("Nama minimal 3 huruf.");
    if (!/^(\+62|62|0)8[\d\s\-.()]{7,15}$/.test(phone.trim())) return setErr("Nomor WhatsApp tidak valid.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setErr("Email tidak valid.");
    if (password.length < 8) return setErr("Kata sandi minimal 8 karakter.");
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      if (!sb) {
        setErr("Layanan belum terkonfigurasi.");
        return;
      }
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: nama.trim(), phone: phone.trim() } },
      });
      if (error) throw error;
      const uid = data.session?.user.id ?? data.user?.id;
      if (!uid) {
        // Konfirmasi email aktif: minta verifikasi, customers dibuat saat masuk pertama.
        router.push("/masuk?info=cek-email");
        return;
      }
      const { error: cErr } = await sb.from("customers").insert({
        business_id: BUSINESS_ID,
        auth_user_id: uid,
        name: nama.trim(),
        phone: phone.trim(),
        email: email.trim(),
        source: "Registrasi Web",
      });
      if (cErr) throw cErr;
      router.push("/profil");
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Pendaftaran gagal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="d-nama" className="label">Nama lengkap</label>
        <input id="d-nama" className="field" value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="name" placeholder="Nama Anda" />
      </div>
      <div>
        <label htmlFor="d-phone" className="label">Nomor WhatsApp</label>
        <input id="d-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="081234567890" />
        <p className="mt-1 text-xs text-muted">Dipakai menautkan pesanan lama Anda saat checkout.</p>
      </div>
      <div>
        <label htmlFor="d-email" className="label">Email</label>
        <input id="d-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@email.id" />
      </div>
      <div>
        <label htmlFor="d-pass" className="label">Kata sandi (min 8)</label>
        <input id="d-pass" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="••••••••" />
      </div>
      {err ? <p className="error-text" role="alert">{err}</p> : null}
      <button type="submit" className="btn-gold w-full" disabled={busy}>
        {busy ? "Mendaftar…" : "Daftar"}
      </button>
      <p className="text-sm text-center">
        Sudah punya akun? <Link href="/masuk" className="font-bold text-gold-deep underline">Masuk</Link>
      </p>
    </form>
  );
}
