import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS_ID, CONTACT_FALLBACK } from "@/lib/constants";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { EventTypeRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Mengenal Rasa Nusantara Catering Nganjuk: dapur yang terpantau, terdokumentasi, dan tepat waktu.",
};

export const dynamic = "force-dynamic";

async function getLayanan(): Promise<string[]> {
  const sb = createAnonServerClient();
  if (!sb) return [];
  try {
    const { data } = await sb.from("event_types").select("name").eq("business_id", BUSINESS_ID);
    return ((data ?? []) as Array<{ name: string }>).map((d) => d.name);
  } catch {
    return [];
  }
}

export default async function TentangPage() {
  const layanan = await getLayanan();
  const daftar = layanan.length ? layanan : ["Pernikahan", "Korporat", "Pengajian", "Aqiqah"];
  return (
    <div className="container-x py-10">
      <p className="kicker">Tentang Kami</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl font-bold leading-tight">
        Dapur Nganjuk yang bikin tuan rumah bisa ikut menikmati acara
      </h1>
      <div className="rule-gold my-4" aria-hidden="true" />

      <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4 leading-relaxed text-ink/80">
          <p>
            <strong>Rasa Nusantara Catering</strong> beralamat di {CONTACT_FALLBACK.address}. Kami melayani
            prasmanan dan nasi box untuk hajatan besar maupun acara keluarga — dengan satu janji sederhana:
            makanan hangat tersaji tepat waktu, dan tuan rumah tidak perlu mondar-mandir mengurus dapur.
          </p>
          <p>
            Setiap acara berjalan mengikuti tahapan yang jelas: konsultasi, penawaran tertulis, tanda jadi,
            persiapan, produksi, pengiriman, penataan, penyajian, hingga beres-beres. Status acara Anda bisa
            dipantau sendiri dari halaman <Link href="/lacak" className="font-semibold text-gold-deep underline">Lacak Pesanan</Link>.
          </p>
          <section aria-labelledby="prinsip">
            <h2 id="prinsip" className="font-display text-2xl font-bold text-ink">Tiga prinsip dapur kami</h2>
            <ol className="mt-3 space-y-3">
              <li className="card"><strong>1. Terpantau.</strong> <span className="text-ink/70">Setiap tahap ada penanggung jawab dan jadwalnya — bukan sekadar janji lisan.</span></li>
              <li className="card"><strong>2. Terdokumentasi.</strong> <span className="text-ink/70">Penawaran, jumlah tamu, dan kebutuhan diet tercatat tertulis.</span></li>
              <li className="card"><strong>3. Tepat waktu.</strong> <span className="text-ink/70">Prasmanan siap sebelum tamu pertama datang. Itu standar, bukan bonus.</span></li>
            </ol>
          </section>
        </div>
        <aside className="card h-fit" aria-label="Layanan kami">
          <p className="kicker">Layanan</p>
          <ul className="mt-3 space-y-2">
            {daftar.map((l) => (
              <li key={l} className="border-b border-line pb-2 text-sm font-semibold last:border-0">✦ {l}</li>
            ))}
          </ul>
          <Link href="/booking" className="btn-gold mt-4 w-full text-sm">Diskusikan Acara Anda</Link>
        </aside>
      </div>
    </div>
  );
}
