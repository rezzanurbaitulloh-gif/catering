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

async function getPromos(): Promise<string[]> {
  const sb = createAnonServerClient();
  if (!sb) return [];
  try {
    const now = new Date().toISOString();
    const { data } = await sb
      .from("promotions")
      .select("code")
      .eq("business_id", BUSINESS_ID)
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .limit(3);
    return ((data ?? []) as Array<{ code: string }>).map((p) => p.code);
  } catch {
    return [];
  }
}

export default async function PaketPage({ searchParams }: { searchParams: { kat?: string; q?: string; tanggal?: string } }) {
  const [packages, promos] = await Promise.all([getPackages(), getPromos()]);
  return (
    <div className="container-x py-8">
      <p className="kicker-rule">Jelajah Katalog</p>
      <h1 className="display-tight mt-3 font-display text-4xl font-semibold sm:text-5xl">Paket &amp; Harga</h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-ink/70">
        Bandingkan paket prasmanan, nasi box, dan premium — harga per pax transparan.
      </p>
      <div className="mt-6">
        <PaketFilter initial={packages} initialKat={searchParams.kat ?? ""} initialQ={searchParams.q ?? ""} initialTanggal={searchParams.tanggal ?? ""} promos={promos} />
      </div>
    </div>
  );
}
