import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Pertanyaan umum: DP, minimal pax, wilayah, pembayaran, perubahan jadwal.",
};

const QA = [
  {
    q: "Berapa DP untuk mengunci tanggal?",
    a: "DP minimal 30% dari total penawaran. Tanggal Anda terkunci di kalender dapur setelah DP kami terima dan terverifikasi.",
  },
  {
    q: "Berapa minimal pemesanan?",
    a: "Prasmanan mulai 200 pax, nasi box mulai 50 box, paket premium mulai 150 pax. Di bawah itu, hubungi kami untuk penyesuaian.",
  },
  {
    q: "Wilayah mana saja yang dilayani?",
    a: "Nganjuk dan sekitarnya (Kertosono, Bagor, Sukomoro, Wilangan). Luar itu memungkinkan dengan biaya transport tambahan.",
  },
  {
    q: "Bagaimana cara membayar?",
    a: "Transfer bank, QRIS, tunai, atau daring via Midtrans (VA, e-wallet, kartu). Setiap pembayaran tercatat dan bisa dilacak di halaman Lacak Pesanan.",
  },
  {
    q: "Bisakah jumlah tamu berubah setelah memesan?",
    a: "Bisa. Ajukan perubahan dari dashboard akun Anda; admin menghitung dampak harga dan jadwal sebelum disetujui. Final pax dikunci menjelang hari-H.",
  },
  {
    q: "Bagaimana jika ada alergi atau menu vegetarian?",
    a: "Tulis saat booking (kolom kebutuhan diet) — bukan di catatan bebas. Dapur memverifikasi terpisah dan menandainya prioritas.",
  },
  {
    q: "Apakah peralatan dibawa kembali?",
    a: "Ya. Semua peralatan (chafing dish, meja, alat saji) kami data saat berangkat dan direkonsiliasi saat kembali.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="kicker">Bantuan</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Pertanyaan Umum</h1>
      <div className="rule-gold my-4" aria-hidden="true" />
      <div className="space-y-3">
        {QA.map((x) => (
          <details key={x.q} className="card !p-4">
            <summary className="cursor-pointer font-bold">{x.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{x.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-center text-sm">
        Masih bingung? <Link href="/kontak" className="font-bold text-gold-deep underline">Hubungi kami</Link>
      </p>
    </div>
  );
}
