import type { Metadata } from "next";
import Link from "next/link";
import { PaymentStatusPanel } from "@/components/PayOnline";

export const metadata: Metadata = { title: "Pembayaran Gagal" };

// Error Redirect URL untuk dashboard Midtrans:
// https://catering-customer.vercel.app/pembayaran/gagal
export default function GagalPage({ searchParams }: { searchParams: { order_id?: string } }) {
  const orderId = searchParams.order_id ?? "";
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="kicker">Pembayaran</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Belum berhasil</h1>
      <p className="mt-2 text-sm text-ink/70">
        Pembayaran tidak selesai. Uang Anda aman — tidak ada dana terpotong untuk transaksi gagal.
        Silakan coba lagi atau hubungi kami via WhatsApp.
      </p>
      <div className="mt-5">
        {orderId ? (
          <PaymentStatusPanel orderId={orderId} />
        ) : (
          <p className="rounded-brand border border-line bg-white p-4 text-sm">Nomor order tidak terbawa.</p>
        )}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/kontak" className="btn-gold">Hubungi Kami</Link>
        <Link href="/" className="btn-outline">Beranda</Link>
      </div>
    </div>
  );
}
