import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import CoverflowCarousel from "@/components/CoverflowCarousel";
import QuickBook from "@/components/QuickBook";
import MenuTabs from "@/components/MenuTabs";
import TestimonialMarquee from "@/components/TestimonialMarquee";
import Reveal from "@/components/Reveal";
import { ChatIcon, ChefIcon, ClockIcon, WheatIcon } from "@/components/icons";
import { BUSINESS_ID, HERO_IMG, HERO_FALLBACK, SITE } from "@/lib/constants";
import { createAnonServerClient } from "@/lib/supabase-server";
import { createPrivilegedClient } from "@/lib/server-db";
import type { MenuItemRow, PackageRow, TestimonialRow, VenueRow } from "@/lib/types";

export const metadata: Metadata = {
  title: `${SITE.tagline}`,
  description: SITE.description,
};

export const dynamic = "force-dynamic";

async function getHomeData() {
  const sb = createAnonServerClient();
  const fallback = {
    hero: HERO_FALLBACK, packages: [] as PackageRow[], testimonials: [] as TestimonialRow[],
    menu: [] as MenuItemRow[], venues: [] as VenueRow[],
    rating: null as { avg: number; count: number } | null,
    stats: { done: 0, pax: 0, packages: 0 },
  };
  if (!sb) return fallback;
  try {
    const [heroRes, pkgRes, testiRes, menuRes, venueRes] = await Promise.all([
      sb.from("website_content").select("value").eq("business_id", BUSINESS_ID).eq("key", "hero").maybeSingle(),
      sb.from("packages").select("*").eq("business_id", BUSINESS_ID).eq("is_active", true).order("base_price_per_pax", { ascending: true }).limit(4),
      sb.from("testimonials").select("*").eq("business_id", BUSINESS_ID).eq("is_published", true).order("rating", { ascending: false }).limit(8),
      sb.from("menu_items").select("*").eq("business_id", BUSINESS_ID).eq("is_active", true).order("category").order("name").limit(60),
      sb.from("venues").select("*").eq("business_id", BUSINESS_ID).limit(6),
    ]);
    const heroValue = (heroRes.data?.value ?? {}) as Record<string, unknown>;
    const testimonials = (testiRes.data ?? []) as TestimonialRow[];
    const ratings = testimonials.map((t) => t.rating).filter((r) => r > 0);
    // Statistik nyata khusus server (tanpa membuka data privat ke publik).
    let done = 0;
    let pax = 0;
    try {
      const { client, mode } = createPrivilegedClient();
      if (client && mode === "service") {
        const { data: evs } = await client
          .from("events")
          .select("status,pax_final,pax_confirmed")
          .eq("business_id", BUSINESS_ID)
          .in("status", ["COMPLETED", "CLOSED"])
          .limit(500);
        const list = (evs ?? []) as Array<{ status: string; pax_final: number | null; pax_confirmed: number }>;
        done = list.length;
        pax = list.reduce((a, e) => a + (e.pax_final ?? e.pax_confirmed ?? 0), 0);
      }
    } catch { /* statistik opsional */ }
    const packages = (pkgRes.data ?? []) as PackageRow[];
    return {
      hero: {
        title: typeof heroValue.title === "string" ? heroValue.title : HERO_FALLBACK.title,
        subtitle: typeof heroValue.subtitle === "string" ? heroValue.subtitle : HERO_FALLBACK.subtitle,
        cta: typeof heroValue.cta === "string" ? heroValue.cta : HERO_FALLBACK.cta,
      },
      packages,
      testimonials,
      menu: (menuRes.data ?? []) as MenuItemRow[],
      venues: (venueRes.data ?? []) as VenueRow[],
      rating: ratings.length ? { avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10, count: ratings.length } : null,
      stats: { done, pax, packages: packages.length },
    };
  } catch {
    return fallback;
  }
}

const SERVICES = [
  { icon: WheatIcon, title: "Pernikahan", body: "Prasmanan elegan + dekorasi + layanan saji lengkap.", kat: "Prasmanan" },
  { icon: ChefIcon, title: "Korporat", body: "Nasi box & prasmanan kantor, rapat, gathering.", kat: "Nasi Box" },
  { icon: ChatIcon, title: "Pengajian", body: "Menu rumahan hangat untuk syukuran & tasyakuran.", kat: "Pengajian" },
  { icon: ClockIcon, title: "Tepat Waktu", body: "Keberangkatan & setup terpantau per tahap.", kat: "" },
  { icon: WheatIcon, title: "Premium", body: "Live stall & carving untuk momen istimewa.", kat: "Premium" },
  { icon: ChefIcon, title: "Konsultasi Menu", body: "Disusun sesuai anggaran & kebutuhan diet tamu.", kat: "" },
];

const MENGAPA = [
  { icon: WheatIcon, title: "Bahan Pilihan", body: "Belanja harian pasar Nganjuk, dimasak di hari-H." },
  { icon: ClockIcon, title: "Tepat Waktu", body: "Jadwal keberangkatan & setup terpantau per tahap." },
  { icon: ChefIcon, title: "Tim Profesional", body: "Dapur & layanan berpengalaman ratusan hajatan." },
  { icon: ChatIcon, title: "Layanan Konsultasi", body: "Dibantu pilih menu sesuai anggaran acara Anda." },
];

export default async function HomePage() {
  const { hero, packages, testimonials, menu, venues, rating, stats } = await getHomeData();

  return (
    <>
      {/* Hero editorial: serif raksasa + komposisi lingkaran + booking cepat */}
      <section className="overflow-hidden" aria-labelledby="tajuk-utama">
        <div className="container-x grid items-center gap-10 pb-10 pt-12 md:grid-cols-[1.05fr_0.95fr] md:pt-16">
          <div className="hero-rise hero-rise-1">
            <p className="kicker-rule">Katering Hajatan · Nganjuk</p>
            <h1 id="tajuk-utama" className="display-tight mt-4 font-display text-5xl font-semibold leading-[1.04] text-bark-ink sm:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">{hero.subtitle}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/paket" className="touch inline-flex items-center justify-center rounded-full bg-bark-ink px-8 py-3.5 text-base font-semibold text-cream transition-colors hover:bg-bark-deep">
                {hero.cta}
              </Link>
              <Link href="/booking" className="touch inline-flex items-center justify-center rounded-full border border-bark-ink/25 px-8 py-3.5 text-base font-semibold text-bark-ink transition-colors hover:border-bark-ink hover:bg-bark-ink hover:text-cream">
                Pesan Acara Anda
              </Link>
            </div>
          </div>
          <div className="hero-rise hero-rise-2 relative mx-auto w-full max-w-[440px]">
            <div className="absolute -inset-4 rounded-full bg-gold-soft/60 blur-2xl" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMG}
              alt="Hidangan prasmanan Rasa Nusantara"
              className="relative aspect-square w-full rounded-full border-[10px] border-white object-cover shadow-2xl"
              loading="eager"
            />
            {rating ? (
              <div className="absolute -left-2 top-10 rounded-brand border border-line bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:-left-8" role="status" aria-label={`Rating ${rating.avg} dari ${rating.count} testimoni`}>
                <p className="font-display text-2xl font-bold text-bark-deep">{rating.avg.toLocaleString("id-ID")}</p>
                <p className="text-sm font-bold text-gold">{"★".repeat(Math.round(rating.avg))}</p>
                <p className="mt-0.5 text-xs text-muted">{rating.count} testimoni</p>
              </div>
            ) : null}
            {stats.pax > 0 ? (
              <div className="absolute -right-2 bottom-10 rounded-brand border border-line bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:-right-6" role="status">
                <p className="font-display text-2xl font-bold text-bark-deep">{stats.pax.toLocaleString("id-ID")}+</p>
                <p className="mt-0.5 text-xs text-muted">porsi tersaji</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="container-x pb-12">
          <QuickBook />
          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-4 border-t border-line pt-6 text-sm">
            <div><dt className="text-muted">Acara selesai</dt><dd className="font-display text-3xl font-semibold">{stats.done}</dd></div>
            <div><dt className="text-muted">Paket aktif</dt><dd className="font-display text-3xl font-semibold">{stats.packages}</dd></div>
            <div><dt className="text-muted">Tanda jadi</dt><dd className="font-display text-3xl font-semibold">30%</dd></div>
            <div><dt className="text-muted">Wilayah</dt><dd className="font-display text-3xl font-semibold">Nganjuk+</dd></div>
          </dl>
        </div>
      </section>

      {/* Layanan */}
      <section className="container-x py-12" aria-labelledby="layanan">
        <p className="kicker-rule">01 · Layanan Kami</p>
        <h2 id="layanan" className="mt-2 font-display text-3xl font-bold">Apa yang Kami Tawarkan</h2>
        <Reveal>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <li key={s.title} className="card group">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-soft text-bark-deep" aria-hidden="true"><s.icon /></span>
              <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink/70">{s.body}</p>
              {s.kat ? (
                <Link href={`/paket?kat=${encodeURIComponent(s.kat)}`} className="mt-3 inline-flex min-h-[44px] items-center text-sm font-bold text-gold-deep underline group-hover:no-underline">
                  Lihat paket →
                </Link>
              ) : (
                <Link href="/kontak" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-bold text-gold-deep underline group-hover:no-underline">
                  Hubungi kami →
                </Link>
              )}
            </li>
          ))}
        </ul>
        </Reveal>
      </section>

      {/* Paket populer: coverflow 3D interaktif */}
      <section className="overflow-hidden border-y border-line bg-white/60" aria-labelledby="paket-unggulan">
        <div className="container-x py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker-rule">02 · Penawaran Spesial</p>
              <h2 id="paket-unggulan" className="display-tight mt-3 font-display text-3xl font-semibold sm:text-4xl">Paket Populer</h2>
            </div>
            <Link href="/paket" className="touch inline-flex items-center text-sm font-bold text-gold-deep underline">
              Lihat Semua →
            </Link>
          </div>
          {packages.length >= 3 ? (
            <div className="mt-4">
              <CoverflowCarousel items={packages} />
            </div>
          ) : packages.length ? (
            <Reveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((p) => (
                <PackageCard key={p.id} pkg={p} />
              ))}
            </div>
            </Reveal>
          ) : (
            <p className="card mt-6 text-sm text-ink/70" role="status">
              Daftar paket sedang dimuat. Hubungi WhatsApp kami untuk buku menu terbaru.
            </p>
          )}
        </div>
      </section>

      {/* Jelajahi menu */}
      <section className="container-x py-12" aria-labelledby="menu">
        <p className="kicker-rule">03 · Menu Kami</p>
        <h2 id="menu" className="mt-2 font-display text-3xl font-bold">Hidangan Paling Digemari</h2>
        <div className="mt-5">
          <MenuTabs items={menu} />
        </div>
      </section>

      {/* Venue */}
      {venues.length ? (
        <section className="border-y border-line bg-white/60" aria-labelledby="venue">
          <div className="container-x py-12">
            <p className="kicker-rule">04 · Venue Rekanan</p>
            <h2 id="venue" className="mt-2 font-display text-3xl font-bold">Lokasi Favorit Pelanggan</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {venues.slice(0, 3).map((v) => (
                <li key={v.id} className="card">
                  <h3 className="font-display text-xl font-bold">{v.name}</h3>
                  <p className="mt-1 text-sm text-ink/70">{v.address}</p>
                  {v.contact_name ? <p className="mt-2 text-sm">CP: {v.contact_name}{v.contact_phone ? ` · ${v.contact_phone}` : ""}</p> : null}
                  {v.maps_url ? <a href={v.maps_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-[44px] items-center text-sm font-bold text-gold-deep underline">Lihat peta →</a> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Mengapa */}
      <section className="container-x py-12" aria-labelledby="mengapa">
        <p className="kicker-rule">05 · Cerita Kami</p>
        <h2 id="mengapa" className="mt-2 max-w-2xl font-display text-3xl font-bold">Dipercaya ratusan hajatan di Nganjuk &amp; sekitarnya</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MENGAPA.map((m) => (
            <li key={m.title} className="flex gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-soft text-bark-deep" aria-hidden="true"><m.icon /></span>
              <span>
                <span className="block font-bold">{m.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink/70">{m.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Testimoni marquee */}
      <section className="border-y border-line bg-white/60 py-12" aria-labelledby="kata-mereka">
        <div className="container-x">
          <p className="kicker-rule">06 · Kata Mereka</p>
          <h2 id="kata-mereka" className="mt-2 font-display text-3xl font-bold">Makanan seramah pelayanannya</h2>
        </div>
        <TestimonialMarquee items={testimonials} />
      </section>

      {/* Pita CTA */}
      <section className="container-x py-12" aria-labelledby="cta-akhir">
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
