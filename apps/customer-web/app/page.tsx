import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import { BUSINESS_ID, CATEGORIES, CONTACT_FALLBACK, HERO_IMG, HERO_FALLBACK, SITE } from "@/lib/constants";
import { waLink } from "@/lib/format";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { PackageRow, TestimonialRow } from "@/lib/types";

export const metadata: Metadata = {
  title: `${SITE.tagline}`,
  description: SITE.description,
};

export const dynamic = "force-dynamic";

async function getHomeData() {
  const fallback = { hero: HERO_FALLBACK, packages: [] as PackageRow[], testimonials: [] as TestimonialRow[], rating: null as { avg: number; count: number } | null };
  const sb = createAnonServerClient();
  if (!sb) return fallback;
  try {
    const [heroRes, pkgRes, testiRes] = await Promise.all([
      sb.from("website_content").select("value").eq("business_id", BUSINESS_ID).eq("key", "hero").maybeSingle(),
      sb.from("packages").select("*").eq("business_id", BUSINESS_ID).eq("is_active", true).order("base_price_per_pax", { ascending: true }).limit(4),
      sb.from("testimonials").select("*").eq("business_id", BUSINESS_ID).eq("is_published", true).order("rating", { ascending: false }).limit(6),
    ]);
    const heroValue = (heroRes.data?.value ?? {}) as Record<string, unknown>;
    const testimonials = (testiRes.data ?? []) as TestimonialRow[];
    const ratings = testimonials.map((t) => t.rating).filter((r) => r > 0);
    return {
      hero: {
        title: typeof heroValue.title === "string" ? heroValue.title : HERO_FALLBACK.title,
        subtitle: typeof heroValue.subtitle === "string" ? heroValue.subtitle : HERO_FALLBACK.subtitle,
        cta: typeof heroValue.cta === "string" ? heroValue.cta : HERO_FALLBACK.cta,
      },
      packages: (pkgRes.data ?? []) as PackageRow[],
      testimonials,
      rating: ratings.length ? { avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10, count: ratings.length } : null,
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
  const { hero, packages, testimonials, rating } = await getHomeData();
  const wa = waLink(CONTACT_FALLBACK.whatsapp, "Halo Rasa Nusantara Catering, saya ingin minta penawaran.");

  return (
    <>
      {/* Hero mockup: headline kiri, foto arch + kartu rating kanan */}
      <section className="overflow-hidden bg-cream" aria-labelledby="tajuk-utama">
        <div className="container-x grid items-center gap-10 py-12 md:grid-cols-2 md:py-16">
          <div>
            <p className="kicker">Katering Berkualitas</p>
            <h1 id="tajuk-utama" className="mt-3 font-display text-4xl font-bold leading-[1.08] sm:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/75">{hero.subtitle}</p>
            <form action="/paket" method="get" role="search" aria-label="Cari paket" className="mt-6 flex max-w-xl flex-col gap-2 rounded-brand border border-line bg-white p-2 shadow-sm sm:flex-row">
              <label htmlFor="hero-q" className="sr-only">Cari paket catering</label>
              <input id="hero-q" name="q" type="search" placeholder="Cari paket catering…" className="field !border-0 !bg-transparent" autoComplete="off" />
              <button type="submit" className="btn-gold shrink-0">
                Cari Paket
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Kategori cepat">
              {CATEGORIES.map((c) => (
                <Link key={c.label} href={`/paket?kat=${encodeURIComponent(c.label)}`} className="chip !py-1.5 !text-[13px]">
                  {c.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/booking" className="btn-gold">
                {hero.cta}
              </Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline">
                Chat WhatsApp
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMG}
              alt="Hidangan prasmanan Rasa Nusantara"
              className="h-[420px] w-full rounded-b-brand rounded-t-[999px] border-4 border-white object-cover shadow-xl sm:h-[480px]"
              loading="eager"
            />
            {rating ? (
              <div className="absolute -left-3 bottom-8 rounded-brand border border-line bg-white/95 px-4 py-3 text-center shadow-lg backdrop-blur sm:-left-8" role="status" aria-label={`Rating ${rating.avg} dari ${rating.count} testimoni`}>
                <p className="font-display text-3xl font-bold text-bark-deep">{rating.avg.toLocaleString("id-ID")}</p>
                <p className="text-xs font-bold text-gold">{"★".repeat(Math.round(rating.avg))}</p>
                <p className="mt-0.5 text-xs text-muted">{rating.count} testimoni pelanggan</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Kategori ala marketplace */}
      <section className="container-x py-10" aria-labelledby="kategori">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="kicker">Kategori Catering</p>
            <h2 id="kategori" className="mt-2 font-display text-2xl font-bold sm:text-3xl">Temukan paket sesuai acara Anda</h2>
          </div>
          <Link href="/paket" className="touch inline-flex items-center text-sm font-bold text-gold-deep underline">
            Lihat Semua →
          </Link>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Prasmanan", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=60", desc: "Untuk acara besar" },
            { label: "Nasi Box", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=60", desc: "Praktis & hemat" },
            { label: "Pengajian", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=60", desc: "Hangat kekeluargaan" },
            { label: "Premium", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=60", desc: "Kelas istimewa" },
          ].map((c) => (
            <li key={c.label}>
              <Link href={`/paket?kat=${encodeURIComponent(c.label)}`} className="food-card group block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.label} loading="lazy" className="!h-28 sm:!h-32" />
                <span className="block p-3">
                  <span className="block text-sm font-bold group-hover:text-gold-deep">{c.label}</span>
                  <span className="block text-xs text-muted">{c.desc}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
        <h2 id="kata-mereka" className="mt-2 text-center font-display text-3xl font-bold">Yang Mereka Katakan</h2>
        <TestimonialCarousel items={testimonials} />
      </section>

      {/* Pita CTA */}
      <section className="container-x pb-12" aria-labelledby="cta-akhir">
        <div className="rounded-brand bg-caramel px-6 py-10 text-center text-bark-ink sm:px-12">
          <h2 id="cta-akhir" className="font-display text-3xl font-bold">Siap Mengadakan Acara Spesial?</h2>
          <p className="mx-auto mt-2 max-w-xl text-bark-ink/75">Ceritakan tanggal &amp; jumlah tamu — penawaran tertulis menyusul via WhatsApp.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/paket" className="touch inline-flex items-center justify-center rounded-brand bg-bark-ink px-6 py-3 font-semibold text-cream hover:bg-ink">
              Lihat Paket
            </Link>
            <Link href="/booking" className="touch inline-flex items-center justify-center rounded-brand border-2 border-bark-ink/70 px-6 py-3 font-semibold text-bark-ink hover:bg-bark-ink hover:text-cream">
              Konsultasi
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
