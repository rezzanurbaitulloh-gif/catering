import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import QuickBook from "@/components/QuickBook";
import MenuTabs from "@/components/MenuTabs";
import TestimonialMarquee from "@/components/TestimonialMarquee";
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
      {/* Hero: headline + dwi-CTA + booking cepat + statistik nyata */}
      <section className="relative overflow-hidden bg-bark-ink text-cream" aria-labelledby="tajuk-utama">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_IMG} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-bark-ink/95 via-bark-ink/70 to-bark-ink/20" aria-hidden="true" />
        <div className="container-x relative py-14 md:py-20">
          <p className="kicker !text-caramel">Rencanakan Hajatan Impian · Pesan Catering Terbaik</p>
          <h1 id="tajuk-utama" className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.1] sm:text-5xl">
            {hero.title}
          </h1>
          <p className="mt-3 max-w-xl leading-relaxed text-cream/80">{hero.subtitle}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/booking" className="btn-gold">
              Pesan Sekarang
            </Link>
            <Link href="/paket" className="touch inline-flex items-center justify-center gap-2 rounded-brand border border-cream/40 px-6 py-3 text-base font-semibold text-cream hover:bg-cream/10">
              Jelajahi Paket
            </Link>
          </div>
          <div className="mt-6">
            <QuickBook />
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div><dt className="text-cream/60">Acara selesai</dt><dd className="font-display text-2xl font-bold">{stats.done}</dd></div>
            <div><dt className="text-cream/60">Porsi tersaji</dt><dd className="font-display text-2xl font-bold">{stats.pax.toLocaleString("id-ID")}</dd></div>
            <div><dt className="text-cream/60">Paket aktif</dt><dd className="font-display text-2xl font-bold">{stats.packages}</dd></div>
            {rating ? <div><dt className="text-cream/60">Rating</dt><dd className="font-display text-2xl font-bold">{rating.avg.toLocaleString("id-ID")} ★ <span className="text-sm font-normal text-cream/60">({rating.count})</span></dd></div> : null}
          </dl>
        </div>
      </section>

      {/* Layanan */}
      <section className="container-x py-12" aria-labelledby="layanan">
        <p className="kicker">Layanan Kami</p>
        <h2 id="layanan" className="mt-2 font-display text-3xl font-bold">Apa yang Kami Tawarkan</h2>
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
      </section>

      {/* Paket populer */}
      <section className="border-y border-line bg-white/60" aria-labelledby="paket-unggulan">
        <div className="container-x py-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Penawaran Spesial</p>
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
        </div>
      </section>

      {/* Jelajahi menu */}
      <section className="container-x py-12" aria-labelledby="menu">
        <p className="kicker">Menu Kami</p>
        <h2 id="menu" className="mt-2 font-display text-3xl font-bold">Hidangan Paling Digemari</h2>
        <div className="mt-5">
          <MenuTabs items={menu} />
        </div>
      </section>

      {/* Venue */}
      {venues.length ? (
        <section className="border-y border-line bg-white/60" aria-labelledby="venue">
          <div className="container-x py-12">
            <p className="kicker">Venue Rekanan</p>
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
        <p className="kicker">Cerita Kami</p>
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
          <p className="kicker">Kata Mereka</p>
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
