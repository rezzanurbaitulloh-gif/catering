"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("customer-web error:", error);
  }, [error]);
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-xl text-center" role="alert">
        <p className="kicker">Ada Kendala</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Maaf, halaman gagal dimuat</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Koneksi ke dapur data terputus atau terjadi gangguan sesaat. Silakan coba lagi, atau hubungi kami via WhatsApp bila mendesak.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn-gold">
            Coba Lagi
          </button>
          <Link href="/" className="btn-outline">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
