import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-xl text-center" role="status">
        <p className="kicker">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm text-ink/70">
          Alamat yang Anda tuju tidak ada atau sudah dipindahkan. Mari kembali ke meja utama.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="btn-gold">Beranda</Link>
          <Link href="/paket" className="btn-outline">Lihat Paket</Link>
        </div>
      </div>
    </div>
  );
}
