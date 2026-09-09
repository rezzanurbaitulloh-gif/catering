import type { Metadata } from "next";
import DashboardPanel from "./DashboardPanel";

export const metadata: Metadata = {
  title: "Akun Saya",
  description: "Dashboard pelanggan: acara, pembayaran, invoice, progres, riwayat.",
};

export default function AkunPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="kicker">Akun pelanggan</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Dashboard Saya</h1>
      <div className="mt-6">
        <DashboardPanel />
      </div>
    </div>
  );
}
