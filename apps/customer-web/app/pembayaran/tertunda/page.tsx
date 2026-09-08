import type { Metadata } from "next";
import Link from "next/link";
import { PaymentStatusPanel } from "@/components/PayOnline";

export const metadata: Metadata = { title: "Menunggu Pembayaran" };

// Unfinish Redirect URL untuk dashboard Midtrans:
// https://catering-customer.vercel.app/pembayaran/tertunda
export default function TertundaPage({ searchParams }: { searchParams: { order_id?: string } }) {
  const orderId = searchParams.order_id ?? "";
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="kicker">Pembayaran</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Menunggu pembayaran</h1>
      <p className="mt-2 text-sm text-ink/70">
        Selesaikan pembayaran sebelum kedaluwarsa (mis. VA ~24 jam, QRIS ~30 menit).
        Halaman ini memantau status otomatis.
      </p>
      <div className="mt-5">
        {orderId ? (
          <PaymentStatusPanel orderId={orderId} />
        ) : (
          <p className="rounded-brand border border-line bg-white p-4 text-sm">Nomor order tidak terbawa.</p>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/lacak" className="btn-gold">Lacak Pesanan</Link>
        <Link href="/" className="btn-outline">Beranda</Link>
      </div>
    </div>
  );
}
