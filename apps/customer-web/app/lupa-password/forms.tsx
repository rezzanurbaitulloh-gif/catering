"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMsg("Isi email yang valid.");
      setState("failed");
      return;
    }
    setState("busy");
    setMsg("");
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error("Layanan belum terkonfigurasi.");
      const site = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${site.replace(/\/$/, "")}/reset-password`,
      });
      if (error) throw error;
      setState("done");
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : "Gagal mengirim tautan.");
      setState("failed");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-brand border border-[#15803D]/40 bg-[#15803D]/5 p-4 text-sm" role="status">
        Tautan reset terkirim — periksa email (termasuk spam), lalu ikuti instruksinya.
      </p>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="f-email" className="label">Email terdaftar</label>
        <input id="f-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      {state === "failed" && msg ? <p className="error-text" role="alert">{msg}</p> : null}
      <button type="submit" className="btn-gold w-full" disabled={state === "busy"}>
        {state === "busy" ? "Mengirim…" : "Kirim Tautan Reset"}
      </button>
      <p className="text-sm text-center">
        <Link href="/masuk" className="font-bold text-gold-deep underline">Kembali masuk</Link>
      </p>
    </form>
  );
}

export function ResetForm() {
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMsg("Kata sandi minimal 8 karakter.");
      setState("failed");
      return;
    }
    setState("busy");
    setMsg("");
    try {
      const sb = supabaseBrowser();
      if (!sb) throw new Error("Layanan belum terkonfigurasi.");
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setState("done");
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : "Gagal mengganti sandi. Tautan mungkin kedaluwarsa — minta yang baru.");
      setState("failed");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-brand border border-[#15803D]/40 bg-[#15803D]/5 p-4 text-sm" role="status">
        <p className="font-bold">Sandi diganti ✓</p>
        <p className="mt-1"><Link href="/masuk" className="font-bold text-gold-deep underline">Masuk dengan sandi baru</Link></p>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="r-pass" className="label">Kata sandi baru (min 8)</label>
        <input id="r-pass" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      {state === "failed" && msg ? <p className="error-text" role="alert">{msg}</p> : null}
      <button type="submit" className="btn-gold w-full" disabled={state === "busy"}>
        {state === "busy" ? "Menyimpan…" : "Ganti Sandi"}
      </button>
    </form>
  );
}
