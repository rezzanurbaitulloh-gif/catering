"use client";

import Link from "next/link";
import { useState } from "react";

// Form kontak -> POST /api/inquiries dengan event_type "Tanya-Jawab".
export default function ContactForm() {
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [pesan, setPesan] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [failMsg, setFailMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (nama.trim().length < 3) errs.nama = "Nama minimal 3 huruf.";
    if (!/^(\+62|62|0)8[\d\s\-.()]{7,15}$/.test(phone.trim())) errs.phone = "Nomor WhatsApp tidak valid. Contoh: 081234567890.";
    if (pesan.trim().length < 10) errs.pesan = "Tulis pertanyaan minimal 10 huruf agar mudah kami jawab.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setState("sending");
    setFailMsg("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim(), phone: phone.trim(), tipeAcara: "Tanya-Jawab", pax: 1, catatan: pesan.trim() }),
      });
      const data = (await res.json()) as { id?: string; error?: string; details?: Array<{ message?: string }> };
      if (!res.ok) {
        setFailMsg(data.details?.[0]?.message ?? data.error ?? "Gagal mengirim. Coba lagi.");
        setState("failed");
        return;
      }
      setState("done");
    } catch {
      setFailMsg("Jaringan bermasalah. Periksa koneksi lalu coba lagi.");
      setState("failed");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-4 rounded-brand border border-leaf/40 bg-leaf/10 p-5 text-center" role="status">
        <p className="font-display text-xl font-bold">Pesan terkirim ✓</p>
        <p className="mt-1 text-sm text-ink/70">Terima kasih — tim kami akan membalas via WhatsApp secepatnya.</p>
        <Link href="/" className="btn-outline mt-4 text-sm">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
      <div>
        <label htmlFor="k-nama" className="label">Nama</label>
        <input id="k-nama" className="field" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Anda" autoComplete="name" />
        {errors.nama ? <p className="error-text" role="alert">{errors.nama}</p> : null}
      </div>
      <div>
        <label htmlFor="k-phone" className="label">Nomor WhatsApp</label>
        <input id="k-phone" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" inputMode="tel" autoComplete="tel" />
        {errors.phone ? <p className="error-text" role="alert">{errors.phone}</p> : null}
      </div>
      <div>
        <label htmlFor="k-pesan" className="label">Pertanyaan</label>
        <textarea id="k-pesan" className="field min-h-[120px]" value={pesan} onChange={(e) => setPesan(e.target.value)} placeholder="Tulis pertanyaan Anda di sini…" />
        {errors.pesan ? <p className="error-text" role="alert">{errors.pesan}</p> : null}
      </div>
      {state === "failed" ? <p className="error-text" role="alert">{failMsg}</p> : null}
      <button type="submit" className="btn-gold w-full" disabled={state === "sending"}>
        {state === "sending" ? "Mengirim…" : "Kirim Pertanyaan"}
      </button>
    </form>
  );
}
