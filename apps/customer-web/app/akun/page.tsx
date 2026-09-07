import type { Metadata } from "next";
import AccountPanel from "./AccountPanel";

export const metadata: Metadata = {
  title: "Akun Saya",
  description: "Lihat acara, penawaran, dan status pembayaran Anda.",
};

export default function AkunPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="kicker">Akun pelanggan</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Acara &amp; Penawaran Saya</h1>
      <p className="mt-2 text-sm text-ink/70">Masuk dengan nomor WhatsApp yang dipakai saat memesan.</p>
      <div className="mt-6">
        <AccountPanel />
      </div>
    </div>
  );
}
