import type { Metadata } from "next";
import Link from "next/link";
import { PaymentStatusPanel } from "@/components/PayOnline";

export const metadata: Metadata = { title: "Pembayaran Berhasil" };

// Finish Redirect URL untuk dashboard Midtrans:
// https://catering-customer.vercel.app/pembayaran/selesai
export default function SelesaiPage({ searchParams }: { searchParams: { order_id?: string } }) {
  const orderId = searchParams.order_id ?? "";
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="kicker">Pembayaran</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Terima kasih ✓</h1>
      <p className="mt-2 text-sm text-ink/70">
        Pembayaran Anda kami terima. Status final dikonfirmasi otomatis dari Midtrans di bawah ini.
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
