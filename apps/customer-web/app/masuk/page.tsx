import type { Metadata } from "next";
import MasukForm from "./MasukForm";

export const metadata: Metadata = { title: "Masuk" };

export default function MasukPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <p className="kicker">Akun pelanggan</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Masuk</h1>
      <p className="mt-2 text-sm text-ink/70">Kelola pesanan, invoice, dan progres acara Anda.</p>
      <div className="mt-6">
        <MasukForm />
      </div>
    </div>
  );
}
