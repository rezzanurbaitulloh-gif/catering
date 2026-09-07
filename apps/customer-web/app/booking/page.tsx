import type { Metadata } from "next";
import BookingForm from "./BookingForm";
import { BUSINESS_ID } from "@/lib/constants";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { EventTypeRow, PackageRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Booking & Minta Penawaran",
  description: "Formulir pemesanan katering: tanggal, jumlah tamu, lokasi, dan kebutuhan diet. Respons via WhatsApp.",
};

export const dynamic = "force-dynamic";

async function getBookingRefs(paketId: string | undefined) {
  const sb = createAnonServerClient();
  let tipe: string[] = [];
  let paket: PackageRow | null = null;
  if (!sb) return { tipe, paket };
  try {
    const [tRes] = await Promise.all([
      sb.from("event_types").select("name").eq("business_id", BUSINESS_ID),
    ]);
    tipe = ((tRes.data ?? []) as Array<{ name: string }>).map((d) => d.name);
    if (paketId) {
      const { data } = await sb.from("packages").select("*").eq("id", paketId).eq("business_id", BUSINESS_ID).eq("is_active", true).maybeSingle();
      paket = (data ?? null) as PackageRow | null;
    }
  } catch {
    // fallback di bawah
  }
  return { tipe, paket };
}

export default async function BookingPage({ searchParams }: { searchParams: { paket?: string } }) {
  const { tipe, paket } = await getBookingRefs(searchParams.paket);
  const tipeList = tipe.length ? tipe : ["Pernikahan", "Korporat", "Pengajian", "Aqiqah", "Lainnya"];
  return (
    <div className="container-x max-w-3xl py-10">
      <p className="kicker">Reservasi</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Minta Penawaran &amp; Booking</h1>
      <div className="rule-gold my-4" aria-hidden="true" />
      <p className="leading-relaxed text-ink/70">
        Isi detail acara — data masuk sebagai <em>inquiry</em> resmi dan dibalas tim kami via WhatsApp beserta
        penawaran tertulis. Tanda <span aria-hidden="true" className="font-bold text-clay">*</span> wajib diisi.
      </p>
      <div className="card mt-6">
        <BookingForm tipeList={tipeList} paketAwal={paket} />
      </div>
    </div>
  );
}
