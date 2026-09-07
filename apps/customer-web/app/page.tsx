import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import { BUSINESS_ID, CONTACT_FALLBACK, HERO_FALLBACK, SITE } from "@/lib/constants";
import { formatIDR, waLink } from "@/lib/format";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { PackageRow, TestimonialRow } from "@/lib/types";

export const metadata: Metadata = {
  title: `${SITE.tagline}`,
  description: SITE.description,
};

export const dynamic = "force-dynamic";

async function getHomeData() {
  const fallback = { hero: HERO_FALLBACK, packages: [] as PackageRow[], testimonials: [] as TestimonialRow[] };
  const sb = createAnonServerClient();
  if (!sb) return fallback;
  try {
    const [heroRes, pkgRes, testiRes] = await Promise.all([
      sb.from("website_content").select("value").eq("business_id", BUSINESS_ID).eq("key", "hero").maybeSingle(),
      sb.from("packages").select("*").eq("business_id", BUSINESS_ID).eq("is_active", true).order("base_price_per_pax", { ascending: true }).limit(3),
      sb.from("testimonials").select("*").eq("business_id", BUSINESS_ID).eq("is_published", true).order("rating", { ascending: false }).limit(3),
    ]);
    const heroValue = (heroRes.data?.value ?? {}) as Record<string, unknown>;
    return {
      hero: {
        title: typeof heroValue.title === "string" ? heroValue.title : HERO_FALLBACK.title,
        subtitle: typeof heroValue.subtitle === "string" ? heroValue.subtitle : HERO_FALLBACK.subtitle,
        cta: typeof heroValue.cta === "string" ? heroValue.cta : HERO_FALLBACK.cta,
      },
      packages: (pkgRes.data ?? []) as PackageRow[],
      testimonials: (testiRes.data ?? []) as TestimonialRow[],
    };
  } catch {
    return fallback;
  }
}

const CARA_KERJA = [
  { no: "01", title: "Konsultasi & Penawaran", body: "Ceritakan tanggal, jumlah tamu, dan gaya acara lewat formulir atau WhatsApp. Penawaran tertulis menyusul." },
  { no: "02", title: "Survei & Tanda Jadi", body: "Tim survei lokasi bila perlu. DP minimal 30% mengunci tanggal Anda di kalender dapur." },
  { no: "03", title: "Persiapan & Produksi", body: "Belanja, masak, dan packing terpantau per tahap. Jumlah tamu final dikunci menjelang hari-H." },
  { no: "04", title: "Saji & Beres-beres", body: "Tiba tepat waktu, prasmanan hangat tersaji, peralatan kembali kami bereskan." },
];

export default async function HomePage() {
  const { hero, packages, testimonials } = await getHomeData();
  const cheapest = packages.length ? Math.min(...packages.map((p) => p.base_price_per_pax)) : null;
  const wa = waLink(CONTACT_FALLBACK.whatsapp, "Halo Rasa Nusantara Catering, saya ingin minta penawaran.");

  return (
    <>
      {/* Edisi editorial — tajuk kiri, catatan tepi kanan (bukan hero generik tengah + 3 kartu) */}
      <section className="border-b border-line" aria-labelledby="tajuk-utama">
        <div className="container-x grid gap-10 py-12 md:grid-cols-[1.6fr_1fr] md:py-16">
          <div>
            <p className="kicker">Edisi Nganjuk · Jawa Timur — Katering Hajatan</p>
            <h1 id="tajuk-utama" className="mt-3 font-display text-4xl font-bold leading-[1.08] sm:text-5xl">
              {hero.title}
            </h1>
            <div className="rule-gold my-5" aria-hidden="true" />
            <p className="max-w-xl text-lg leading-relaxed text-ink/75">{hero.subtitle}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/booking" className="btn-gold">
                {hero.cta}
              </Link>
              <Link href="/paket" className="btn-outline">
                Lihat Paket &amp; Harga
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              Atau sapa langsung:{" "}
              <a href={wa} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-deep underline">
                WhatsApp {CONTACT_FALLBACK.whatsapp}
              </a>
            </p>
          </div>
          <aside className="card h-fit md:mt-2" aria-label="Catatan dapur">
            <p className="kicker">Catatan Dapur</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-line pb-3">
                <dt className="text-muted">Harga prasmanan</dt>
                <dd className="text-right font-bold">{cheapest ? `Mulai ${formatIDR(cheapest)}/pax` : "Lihat paket"}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-line pb-3">
                <dt className="text-muted">Tanda jadi</dt>
                <dd className="text-right font-bold">DP minimal 30%</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-line pb-3">
                <dt className="text-muted">Wilayah layan</dt>
                <dd className="text-right font-bold">Nganjuk &amp; sekitarnya</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Jam dapur</dt>
                <dd className="text-right font-bold">Senin–Sabtu 08–20</dd>
              </div>
            </dl>
            <Link href="/lacak" className="mt-4 block text-center text-sm font-semibold text-gold-deep underline">
              Sudah pesan? Lacak acara Anda →
            </Link>
          </aside>
        </div>
      </section>

      <section className="container-x py-12" aria-labelledby="paket-unggulan">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker">Dari Buku Menu</p>
            <h2 id="paket-unggulan" className="mt-2 font-display text-3xl font-bold">Paket Unggulan</h2>
          </div>
          <Link href="/paket" className="touch inline-flex items-center text-sm font-bold text-gold-deep underline">
            Semua paket →
          </Link>
        </div>
        {packages.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {packages.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </div>
        ) : (
          <p className="card mt-6 text-sm text-ink/70" role="status">
            Daftar paket sedang dimuat dari dapur data. Silakan hubungi WhatsApp kami untuk buku menu terbaru.
          </p>
        )}
      </section>

      <section className="border-y border-line bg-white/60" aria-labelledby="cara-kerja">
        <div className="container-x py-12">
          <p className="kicker">Cara Kerja</p>
          <h2 id="cara-kerja" className="mt-2 font-display text-3xl font-bold">Dari obrolan sampai piring bersih</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {CARA_KERJA.map((s) => (
              <li key={s.no} className="border-t-2 border-gold pt-4">
                <p className="font-display text-4xl font-bold text-gold/40" aria-hidden="true">{s.no}</p>
                <h3 className="mt-2 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x py-12" aria-labelledby="kata-mereka">
        <p className="kicker">Kata Mereka</p>
        <h2 id="kata-mereka" className="mt-2 font-display text-3xl font-bold">Cerita dari meja prasmanan</h2>
        {testimonials.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="card flex flex-col gap-2">
                <div className="text-gold" aria-label={`Nilai ${t.rating} dari 5`}>
                  {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                </div>
                <blockquote className="font-display text-lg italic leading-relaxed">“{t.message}”</blockquote>
                <figcaption className="mt-auto pt-2 text-sm text-muted">
                  <strong className="text-ink">{t.customer_name}</strong>
                  {t.event_type ? ` · ${t.event_type}` : null}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="card mt-6 text-sm text-ink/70" role="status">Testimoni pelanggan segera tampil di sini.</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/booking" className="btn-gold">Mulai Konsultasi Gratis</Link>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline">Chat WhatsApp</a>
        </div>
      </section>
    </>
  );
}
