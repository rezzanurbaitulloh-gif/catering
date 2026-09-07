"use client";

import { useState } from "react";

// Formulir persetujuan penawaran -> POST /api/quotes/[id]/approve
export default function ApproveForm({ quoteId, disabled, reason }: { quoteId: string; disabled: boolean; reason?: string }) {
  const [nama, setNama] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nama.trim().length < 3) {
      setMsg("Isi nama penyetuju (minimal 3 huruf).");
      setState("failed");
      return;
    }
    setState("sending");
    setMsg("");
    try {
      const res = await fetch(`/api/quotes/${quoteId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approverName: nama.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Gagal menyimpan persetujuan.");
        setState("failed");
        return;
      }
      setState("done");
    } catch {
      setMsg("Jaringan bermasalah. Coba lagi.");
      setState("failed");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-brand border border-[#15803D]/40 bg-[#15803D]/5 p-4 text-sm" role="status">
        <p className="font-bold text-[#15803D]">Penawaran disetujui ✓</p>
        <p className="mt-1 text-ink/70">Terima kasih, {nama}. Tim kami akan menghubungi Anda untuk DP &amp; jadwal.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-brand border border-line bg-white p-4" noValidate>
      <label htmlFor="appr-nama" className="label">Nama penyetuju</label>
      <input
        id="appr-nama"
        className="field"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        placeholder="Nama sesuai KTP/pemesan"
        autoComplete="name"
        disabled={disabled || state === "sending"}
      />
      {state === "failed" && msg ? <p className="error-text" role="alert">{msg}</p> : null}
      {reason ? <p className="mt-2 text-sm text-muted">{reason}</p> : null}
      <button type="submit" className="btn-gold mt-3 w-full" disabled={disabled || state === "sending"}>
        {state === "sending" ? "Menyimpan…" : "Setujui Penawaran Ini"}
      </button>
    </form>
  );
}
