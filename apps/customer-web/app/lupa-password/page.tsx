import type { Metadata } from "next";
import { ForgotForm } from "./forms";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function LupaPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <p className="kicker">Akun pelanggan</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Lupa sandi</h1>
      <div className="mt-6">
        <ForgotForm />
      </div>
    </div>
  );
}
