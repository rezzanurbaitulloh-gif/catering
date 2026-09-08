"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatIDR, formatTanggalPendek } from "@/lib/format";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts?: { onSuccess?: () => void; onPending?: () => void; onError?: () => void; onClose?: () => void }
      ) => void;
    };
  }
}

function loadSnap(clientKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.snap) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://app.midtrans.com/snap/snap.js";
    s.setAttribute("data-client-key", clientKey);
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Midtrans Snap."));
    document.head.appendChild(s);
  });
}

// Tombol bayar daring: buat Snap token server-side → popup Midtrans → redirect.
export default function PayOnlineButton({ eventId, quoteId, label = "Bayar Online" }: { eventId?: string; quoteId?: string; label?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");
  const [msg, setMsg] = useState("");

  async function pay() {
    setState("busy");
    setMsg("");
    try {
      const res = await fetch("/api/payments/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, quote_id: quoteId }),
      });
      const data = (await res.json()) as { token?: string; order_id?: string; error?: string };
      if (!res.ok || !data.token || !data.order_id) {
        setMsg(data.error ?? "Gagal menyiapkan pembayaran.");
        setState("failed");
        return;
      }
      const key = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
      if (!key) {
        // Fallback jujur: arahkan ke halaman Snap bila client key belum ada.
        window.location.href = `/pembayaran/tertunda?order_id=${encodeURIComponent(data.order_id)}`;
        return;
      }
      await loadSnap(key);
      const orderId = data.order_id;
      window.snap?.pay(data.token, {
        onSuccess: () => { window.location.href = `/pembayaran/selesai?order_id=${encodeURIComponent(orderId)}`; },
        onPending: () => { window.location.href = `/pembayaran/tertunda?order_id=${encodeURIComponent(orderId)}`; },
        onError: () => { window.location.href = `/pembayaran/gagal?order_id=${encodeURIComponent(orderId)}`; },
        onClose: () => setState("idle"),
      });
    } catch {
      setMsg("Jaringan bermasalah. Coba lagi.");
      setState("failed");
    }
  }

  return (
    <div>
      <button type="button" onClick={pay} disabled={state === "busy"} className="btn-gold w-full">
        {state === "busy" ? "Menyiapkan…" : label}
      </button>
      {state === "failed" && msg ? <p className="error-text mt-2" role="alert">{msg}</p> : null}
    </div>
  );
}

export function PaymentStatusPanel({ orderId }: { orderId: string }) {
  const [data, setData] = useState<{
    amount: number; method: string; kind: string; status: string; received_at: string | null;
    event: { event_no: string; title: string; payment_status: string } | null;
  } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    let n = 0;
    async function poll() {
      try {
        const res = await fetch(`/api/payments/midtrans/status?order_id=${encodeURIComponent(orderId)}`);
        const body = (await res.json()) as typeof data & { error?: string };
        if (!alive) return;
        if (!res.ok) {
          setErr(body?.error ?? "Gagal memuat status.");
          return;
        }
        setData(body);
        // Polling sampai final (max ~30x).
        if (body && ["PENDING"].includes(body.status) && n < 30) {
          n += 1;
          setTimeout(() => alive && poll(), 4000);
        }
      } catch {
        if (alive) setErr("Jaringan bermasalah.");
      }
    }
    poll();
    return () => {
      alive = false;
    };
  }, [orderId]);

  if (err) return <p className="error-text" role="alert">{err}</p>;
  if (!data) return <p className="text-sm text-muted">Memuat status pembayaran…</p>;
  return (
    <div className="rounded-brand border border-line bg-white p-4 text-sm">
      <div className="flex items-center gap-2">
        <StatusBadge status={data.status} />
        {data.event ? <StatusBadge status={data.event.payment_status} /> : null}
      </div>
      <dl className="mt-3 space-y-1.5">
        <div className="flex justify-between"><dt className="text-muted">Order</dt><dd className="font-mono font-bold">{orderId}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Nominal</dt><dd className="font-bold">{formatIDR(data.amount)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Metode</dt><dd>{data.method}</dd></div>
        {data.received_at ? <div className="flex justify-between"><dt className="text-muted">Diterima</dt><dd>{formatTanggalPendek(data.received_at)}</dd></div> : null}
        {data.event ? <div className="flex justify-between"><dt className="text-muted">Acara</dt><dd>{data.event.event_no} · {data.event.title}</dd></div> : null}
      </dl>
    </div>
  );
}
