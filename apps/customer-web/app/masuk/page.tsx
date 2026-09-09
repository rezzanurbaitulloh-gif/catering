import type { Metadata } from "next";
import DaftarForm from "../daftar/DaftarForm";
import MasukForm from "./MasukForm";

export const metadata: Metadata = { title: "Masuk / Daftar" };

// Dua kartu berdampingan seperti mockup: Masuk + Buat Akun.
export default function MasukPage({ searchParams }: { searchParams: { info?: string } }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-brand border border-line bg-white p-6" aria-labelledby="masuk-judul">
          <h1 id="masuk-judul" className="font-display text-2xl font-bold">Selamat Datang Kembali</h1>
          <p className="mt-1 text-sm text-ink/70">Masuk untuk melacak dan melanjutkan pesanan Anda.</p>
          {searchParams.info === "cek-email" ? (
            <p className="mt-3 rounded-brand bg-gold-soft p-3 text-sm" role="status">
              Akun dibuat — periksa email untuk verifikasi, lalu masuk.
            </p>
          ) : null}
          <div className="mt-4">
            <MasukForm />
          </div>
        </section>
        <section className="rounded-brand border border-line bg-white p-6" aria-labelledby="daftar-judul">
          <h2 id="daftar-judul" className="font-display text-2xl font-bold">Buat Akun</h2>
          <p className="mt-1 text-sm text-ink/70">Daftar untuk mulai memesan catering.</p>
          <div className="mt-4">
            <DaftarForm compact />
          </div>
        </section>
      </div>
    </div>
  );
}
