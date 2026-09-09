import type { Metadata } from "next";
import ProfilePanel from "./ProfilePanel";

export const metadata: Metadata = { title: "Profil Saya" };

export default function ProfilPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="kicker">Akun pelanggan</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Profil &amp; Alamat</h1>
      <div className="mt-6">
        <ProfilePanel />
      </div>
    </div>
  );
}
