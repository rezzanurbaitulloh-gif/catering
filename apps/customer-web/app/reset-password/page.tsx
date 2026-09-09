import type { Metadata } from "next";
import { ResetForm } from "../lupa-password/forms";

export const metadata: Metadata = { title: "Ganti Kata Sandi" };

export default function ResetPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <p className="kicker">Akun pelanggan</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Sandi baru</h1>
      <p className="mt-2 text-sm text-ink/70">Buka halaman ini dari tautan di email Anda.</p>
      <div className="mt-6">
        <ResetForm />
      </div>
    </div>
  );
}
