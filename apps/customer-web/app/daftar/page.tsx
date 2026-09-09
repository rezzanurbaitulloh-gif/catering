import type { Metadata } from "next";
import DaftarForm from "./DaftarForm";

export const metadata: Metadata = { title: "Daftar" };

export default function DaftarPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <p className="kicker">Akun pelanggan</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Daftar</h1>
      <p className="mt-2 text-sm text-ink/70">Satu akun untuk memesan, membayar, dan memantau hajatan.</p>
      <div className="mt-6">
        <DaftarForm />
      </div>
    </div>
  );
}
