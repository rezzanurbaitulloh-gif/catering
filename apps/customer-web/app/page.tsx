import type { Metadata } from "next";
import Link from "next/link";
import PackageCard from "@/components/PackageCard";
import OrbitCarousel from "@/components/OrbitCarousel";
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
  { icon: WheatIcon, title: "Pernikahan", body: "Prasmanan elegan + dekorasi + layanan saji lengkap.", kat: "Prasmanan", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=60" },
  { icon: ChefIcon, title: "Korporat", body: "Nasi box & prasmanan kantor, rapat, gathering.", kat: "Nasi Box", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=60" },
  { icon: ChatIcon, title: "Pengajian", body: "Menu rumahan hangat untuk syukuran & tasyakuran.", kat: "Pengajian", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=60" },
  { icon: ClockIcon, title: "Tepat Waktu", body: "Keberangkatan & setup terpantau per tahap.", kat: "", img: "" },
  { icon: WheatIcon, title: "Premium", body: "Live stall & carving untuk momen istimewa.", kat: "Premium", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=60" },
  { icon: ChefIcon, title: "Konsultasi Menu", body: "Disusun sesuai anggaran & kebutuhan diet tamu.", kat: "", img: "" },
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
      {/* Hero Jai Ambay: pill sambutan + serif italic + kolase berlian */}
      <section className="overflow-hidden" aria-labelledby="tajuk-utama">
        <div className="container-x grid items-center gap-10 pb-10 pt-10 md:grid-cols-[1.05fr_0.95fr] md:pt-14">
          <div className="hero-rise hero-rise-1">
            <p className="inline-flex items-center rounded-full border border-gold/60 bg-gold-soft/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">
              Selamat datang di Rasa Nusantara
            </p>
            <p className="mt-4 font-display text-4xl italic text-gold-deep sm:text-5xl">Hajatan Impian,</p>
            <h1 id="tajuk-utama" className="display-tight mt-1 font-display text-5xl font-semibold italic leading-[1.05] text-bark-ink sm:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">{hero.subtitle}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/booking" className="btn-gold !rounded-full !px-8 !py-3.5">
                Pesan Sekarang
              </Link>
              <Link href="/paket" className="btn-gold !rounded-full !border !border-bark-ink !bg-transparent !px-8 !py-3.5 !text-bark-ink hover:!bg-bark-ink hover:!text-cream">
                Lihat Paket
              </Link>
            </div>
          </div>
          <div className="hero-rise hero-rise-2 relative mx-auto grid w-full max-w-[460px] grid-cols-2 gap-3" aria-hidden="true">
            {[
              { src: HERO_IMG, big: true },
              { src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=60", big: false },
              { src: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=60", big: false },
              { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=500&q=60", big: false },
            ].map((d, i) => (
              <span
                key={i}
                className={`block overflow-hidden border-2 border-gold/70 bg-gold-soft shadow-lg ${i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square"} ${i % 2 ? "[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]" : "rounded-brand"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.src} alt="" loading={i === 0 ? "eager" : "lazy"} className="h-full w-full object-cover" />
              </span>
            ))}
            {rating ? (
              <span className="absolute -bottom-3 left-4 rounded-full border border-line bg-white/95 px-4 py-2 text-xs shadow-lg backdrop-blur" role="status">
                <strong className="font-display text-base text-bark-deep">{rating.avg.toLocaleString("id-ID")} ★</strong> <span className="text-muted">{rating.count} testimoni</span>
              </span>
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
            <li key={s.title} className="card group overflow-hidden !p-0">
              {s.img ? (
                <span className="block h-32 overflow-hidden" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </span>
              ) : null}
              <span className="block p-5 pt-4">
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
              </span>
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
          {packages.length >= 2 ? (
            <div className="mt-4">
              <OrbitCarousel items={packages} />
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
