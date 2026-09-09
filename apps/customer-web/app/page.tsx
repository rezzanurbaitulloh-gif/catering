import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import { BUSINESS_ID, CATEGORIES, CONTACT_FALLBACK, HERO_IMG, HERO_FALLBACK, SITE } from "@/lib/constants";
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
      sb.from("packages").select("*").eq("business_id", BUSINESS_ID).eq("is_active", true).order("base_price_per_pax", { ascending: true }).limit(4),
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
  { no: "1", title: "Pilih Paket", body: "Telusuri paket sesuai acara & anggaran, hitung estimasi instan." },
  { no: "2", title: "Isi Detail", body: "Tanggal, tamu, lokasi, dan kebutuhan diet tamu Anda." },
  { no: "3", title: "Lakukan Pembayaran", body: "DP 30% via transfer/QRIS/Midtrans, pelunasan terpantau." },
  { no: "4", title: "Pesanan Diproses", body: "Produksi, packing, dan pengiriman terdokumentasi." },
];

const MENGAPA = [
  { icon: "🌾", title: "Bahan Pilihan", body: "Belanja harian pasar Nganjuk, dimasak di hari-H." },
  { icon: "⏱", title: "Tepat Waktu", body: "Jadwal keberangkatan & setup terpantau per tahap." },
  { icon: "👨‍🍳", title: "Tim Profesional", body: "Dapur & layanan berpengalaman ratusan hajatan." },
  { icon: "💬", title: "Layanan Konsultasi", body: "Dibantu pilih menu sesuai anggaran acara Anda." },
];

export default async function HomePage() {
  const { hero, packages, testimonials } = await getHomeData();
  const cheapest = packages.length ? Math.min(...packages.map((p) => p.base_price_per_pax)) : null;
  const wa = waLink(CONTACT_FALLBACK.whatsapp, "Halo Rasa Nusantara Catering, saya ingin minta penawaran.");

  return (
    <>
      {/* Hero sinematik foto kuliner */}
      <section className="relative overflow-hidden bg-bark-ink text-cream" aria-labelledby="tajuk-utama">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMG}
          alt="Hidangan prasmanan Rasa Nusantara"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bark-ink/90 via-bark-ink/60 to-transparent" aria-hidden="true" />
        <div className="container-x relative py-16 md:py-24">
          <p className="kicker !text-caramel">Edisi Nganjuk · Jawa Timur — Katering Hajatan</p>
          <h1 id="tajuk-utama" className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.08] sm:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-cream/80">{hero.subtitle}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/booking" className="btn-gold">
              {hero.cta}
            </Link>
            <Link href="/paket" className="btn-outline !border-cream/40 !text-cream hover:!border-cream">
              Lihat Paket &amp; Harga
            </Link>
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div><dt className="text-cream/60">Mulai</dt><dd className="font-bold">{cheapest ? `${formatIDR(cheapest)}/pax` : "—"}</dd></div>
            <div><dt className="text-cream/60">Tanda jadi</dt><dd className="font-bold">DP minimal 30%</dd></div>
            <div><dt className="text-cream/60">Wilayah</dt><dd className="font-bold">Nganjuk &amp; sekitarnya</dd></div>
          </dl>
        </div>
      </section>

      {/* Kategori ala marketplace */}
      <section className="container-x py-8" aria-label="Kategori catering">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <Link key={c.label} href={`/paket?kat=${encodeURIComponent(c.label)}`} className="chip">
              {c.label}
            </Link>
          ))}
          <Link href="/lacak" className="chip">Lacak Pesanan →</Link>
        </div>
      </section>

      {/* Paket populer */}
      <section className="container-x pb-4" aria-labelledby="paket-unggulan">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker">Dari Buku Menu</p>
            <h2 id="paket-unggulan" className="mt-2 font-display text-3xl font-bold">Paket Populer</h2>
          </div>
          <Link href="/paket" className="touch inline-flex items-center text-sm font-bold text-gold-deep underline">
            Lihat Semua →
          </Link>
        </div>
        {packages.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </div>
        ) : (
          <p className="card mt-6 text-sm text-ink/70" role="status">
            Daftar paket sedang dimuat. Hubungi WhatsApp kami untuk buku menu terbaru.
          </p>
        )}
      </section>

      {/* Mengapa */}
      <section className="border-y border-line bg-white/60" aria-labelledby="mengapa">
        <div className="container-x py-12">
          <p className="kicker">Mengapa Memilih Kami</p>
          <h2 id="mengapa" className="mt-2 font-display text-3xl font-bold">Hajatan tenang, tamu kenyang</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {MENGAPA.map((m) => (
              <li key={m.title} className="flex gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-soft text-2xl" aria-hidden="true">{m.icon}</span>
                <span>
                  <span className="block font-bold">{m.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink/70">{m.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cara memesan */}
      <section className="container-x py-12" aria-labelledby="cara-kerja">
        <p className="kicker">Cara Memesan</p>
        <h2 id="cara-kerja" className="mt-2 font-display text-3xl font-bold">Dari obrolan sampai piring bersih</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {CARA_KERJA.map((s) => (
            <li key={s.no} className="border-t-2 border-bark pt-4">
              <p className="font-display text-4xl font-bold text-bark/30" aria-hidden="true">{s.no}</p>
              <h3 className="mt-2 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Testimoni */}
      <section className="container-x pb-12" aria-labelledby="kata-mereka">
        <p className="kicker">Kata Mereka</p>
        <h2 id="kata-mereka" className="mt-2 font-display text-3xl font-bold">Cerita dari meja prasmanan</h2>
        {testimonials.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="card flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bark font-display text-lg font-bold text-cream" aria-hidden="true">
                    {t.customer_name.charAt(0)}
                  </span>
                  <span>
                    <span className="block font-bold">{t.customer_name}</span>
                    <span className="text-gold" aria-label={`Nilai ${t.rating} dari 5`}>
                      {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                    </span>
                  </span>
                </div>
                <blockquote className="font-display text-lg italic leading-relaxed">“{t.message}”</blockquote>
                {t.event_type ? <figcaption className="mt-auto pt-2 text-sm text-muted">{t.event_type}</figcaption> : null}
              </figure>
            ))}
          </div>
        ) : (
          <p className="card mt-6 text-sm text-ink/70" role="status">Testimoni pelanggan segera tampil di sini.</p>
        )}
      </section>

      {/* Pita CTA cokelat */}
      <section className="container-x pb-12" aria-labelledby="cta-akhir">
        <div className="rounded-brand bg-bark px-6 py-10 text-center text-cream sm:px-12">
          <h2 id="cta-akhir" className="font-display text-3xl font-bold">Siap Mengadakan Acara Spesial?</h2>
          <p className="mx-auto mt-2 max-w-xl text-cream/75">Ceritakan tanggal &amp; jumlah tamu — penawaran tertulis menyusul via WhatsApp.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/booking" className="touch inline-flex items-center justify-center rounded-brand bg-cream px-6 py-3 font-semibold text-bark-deep hover:bg-white">
              Minta Penawaran
            </Link>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="touch inline-flex items-center justify-center rounded-brand border border-cream/50 px-6 py-3 font-semibold text-cream hover:bg-cream/10">
              Chat WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
