import { createHash } from "crypto";

// Helper SERVER-ONLY Midtrans (kunci produksi: app.midtrans.com).
// Server Key tidak pernah keluar dari server (env tanpa prefix NEXT_PUBLIC_).

const SNAP_URL = "https://app.midtrans.com/snap/v1/transactions";

function serverKey(): string | null {
  const k = process.env.MIDTRANS_SERVER_KEY;
  if (!k || k.includes("paste-")) return null;
  return k;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://catering-customer.vercel.app").replace(/\/$/, "");
}

export interface SnapResult {
  token: string;
  redirect_url: string;
}

/** Buat transaksi Snap. amount = rupiah integer > 0. */
export async function snapCharge(opts: {
  order_id: string;
  amount: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}): Promise<SnapResult> {
  const key = serverKey();
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi di server.");
  if (!Number.isInteger(opts.amount) || opts.amount <= 0) throw new Error("Nominal tidak valid.");
  const site = siteUrl();
  const res = await fetch(SNAP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: opts.order_id, gross_amount: opts.amount },
      customer_details: {
        first_name: (opts.customerName ?? "Pelanggan").slice(0, 50),
        phone: opts.customerPhone ?? undefined,
        email: opts.customerEmail ?? undefined,
      },
      callbacks: {
        finish: `${site}/pembayaran/selesai?order_id=${encodeURIComponent(opts.order_id)}`,
        error: `${site}/pembayaran/gagal?order_id=${encodeURIComponent(opts.order_id)}`,
        unfinish: `${site}/pembayaran/tertunda?order_id=${encodeURIComponent(opts.order_id)}`,
      },
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof data.token !== "string") {
    const msg = Array.isArray(data.error_messages) ? data.error_messages.join("; ") : "Gagal membuat transaksi Midtrans.";
    throw new Error(msg);
  }
  return { token: data.token as string, redirect_url: data.redirect_url as string };
}

/** Verifikasi signature notifikasi: SHA512(order_id+status_code+gross_amount+serverKey). */
export function verifySignature(input: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const key = serverKey();
  if (!key) return false;
  const raw = `${input.order_id}${input.status_code}${input.gross_amount}${key}`;
  const calc = createHash("sha512").update(raw).digest("hex");
  return calc === input.signature_key;
}
