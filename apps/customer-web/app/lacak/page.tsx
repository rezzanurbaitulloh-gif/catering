import type { Metadata } from "next";
import TrackPanel from "./TrackPanel";

export const metadata: Metadata = {
  title: "Lacak Pesanan",
  description: "Pantau status acara, pembayaran, dan jadwal Anda dengan nomor acara + nomor WhatsApp.",
};

export default function LacakPage() {
  return (
    <div className="container-x max-w-3xl py-10">
      <p className="kicker">Pantau Sendiri</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Lacak Pesanan</h1>
      <div className="rule-gold my-4" aria-hidden="true" />
      <p className="leading-relaxed text-ink/70">
        Masukkan <strong>nomor acara</strong> (cth: EVENT-2026-001, tertera di penawaran/invoice) dan{" "}
        <strong>nomor WhatsApp yang dipakai memesan</strong>. Hanya data milik nomor tersebut yang tampil.
      </p>
      <div className="card mt-6">
        <TrackPanel />
      </div>
    </div>
  );
}
