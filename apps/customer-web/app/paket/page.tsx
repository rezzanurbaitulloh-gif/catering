import type { Metadata } from "next";
import PaketFilter from "./PaketFilter";
import { BUSINESS_ID } from "@/lib/constants";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { PackageRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Paket & Harga",
  description: "Pilih paket prasmanan, nasi box, dan premium Rasa Nusantara Catering. Harga per pax transparan, estimasi otomatis.",
};

export const dynamic = "force-dynamic";

async function getPackages(): Promise<PackageRow[]> {
  const sb = createAnonServerClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("packages")
      .select("*")
      .eq("business_id", BUSINESS_ID)
      .eq("is_active", true)
      .order("base_price_per_pax", { ascending: true });
    if (error) return [];
    return (data ?? []) as PackageRow[];
  } catch {
    return [];
  }
}

export default async function PaketPage({ searchParams }: { searchParams: { kat?: string; q?: string } }) {
  const packages = await getPackages();
  return (
    <div className="container-x py-10">
      <p className="kicker">Buku Menu</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Paket &amp; Harga</h1>
      <div className="rule-gold my-4" aria-hidden="true" />
      <p className="max-w-2xl leading-relaxed text-ink/70">
        Semua harga per pax dan dapat disesuaikan. Buka detail paket untuk melihat isi menu, tambahan (add-on),
        dan menghitung estimasi sesuai jumlah tamu Anda.
      </p>
      <PaketFilter initial={packages} initialKat={searchParams.kat ?? ""} initialQ={searchParams.q ?? ""} />
    </div>
  );
}
