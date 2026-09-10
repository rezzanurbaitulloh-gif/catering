"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatIDR } from "@/lib/format";
import type { PackageRow } from "@/lib/types";

// Coverflow 3D: kartu tengah besar, samping mengecil berperspektif.
// Putar via tombol / titik / geser; jeda otomatis saat interaksi & reduced-motion.
export default function CoverflowCarousel({ items }: { items: PackageRow[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = items.length;

  const go = useCallback((dir: 1 | -1) => {
    setActive((a) => (a + dir + n) % n);
  }, [n]);

  useEffect(() => {
    if (paused || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 5000);
    return () => clearInterval(t);
  }, [paused, n]);

  if (!n) return null;

  // Offset sirkular terpendek (-2..2) agar terasa "mengelilingi".
  const offsetOf = (i: number) => {
    let d = (i - active) % n;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return Math.max(-2, Math.min(2, d));
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="relative mx-auto h-[440px] max-w-4xl overflow-hidden sm:h-[460px]"
        style={{ perspective: "1200px" }}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Paket unggulan"
      >
        {items.map((p, i) => {
          const d = offsetOf(i);
          const abs = Math.abs(d);
          const isCenter = d === 0;
          return (
            <article
              key={p.id}
              aria-hidden={!isCenter}
              className="absolute left-1/2 top-4 w-[240px] sm:w-[280px]"
              style={{
                transform: `translateX(-50%) translateX(${d * 62}%) translateZ(${-abs * 190}px) rotateY(${d * -24}deg) scale(${1 - abs * 0.14})`,
                transformStyle: "preserve-3d",
                zIndex: 10 - abs,
                opacity: abs > 1 ? 0.45 : 1,
                filter: isCenter ? "none" : "saturate(0.85)",
                transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s",
                pointerEvents: abs > 1 ? "none" : "auto",
              }}
            >
              <div className={`food-card ${isCenter ? "shadow-2xl ring-2 ring-bark/70" : "shadow-md"}`}>
                <button
                  type="button"
                  onClick={() => !isCenter && setActive(i)}
                  tabIndex={isCenter ? -1 : 0}
                  aria-label={isCenter ? undefined : `Tampilkan ${p.name}`}
                  className={`block w-full overflow-hidden ${isCenter ? "cursor-default" : "cursor-pointer"}`}
                >
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" aria-hidden={!isCenter} className="!h-40 sm:!h-44" loading="lazy" />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center bg-gold-soft font-display text-4xl font-bold text-bark sm:h-44" aria-hidden="true">
                      {p.name.charAt(0)}
                    </div>
                  )}
                </button>
                <div className="flex flex-col gap-1.5 p-4">
                  <h3 className="font-display text-lg font-bold leading-snug">{p.name}</h3>
                  <p className="font-display text-xl font-bold text-bark-deep">
                    {formatIDR(p.base_price_per_pax)}
                    <span className="font-body text-xs font-normal text-muted"> /pax</span>
                  </p>
                  <p className="text-xs text-muted">Min. {p.min_pax} pax</p>
                  {isCenter ? (
                    <Link href={`/paket/${p.id}`} className="btn-gold mt-1 w-full !py-2.5 text-sm" tabIndex={0}>
                      Lihat &amp; Hitung
                    </Link>
                  ) : (
                    <span className="mt-1 w-full rounded-brand border border-line py-2.5 text-center text-sm font-semibold text-muted" aria-hidden="true">
                      Lihat &amp; Hitung
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <button type="button" onClick={() => go(-1)} className="btn-outline !px-4 !py-2" aria-label="Paket sebelumnya">←</button>
        <div className="flex gap-1.5" role="tablist" aria-label="Pilih paket">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={p.name}
              onClick={() => setActive(i)}
              className={`h-2.5 rounded-full transition-all ${i === active ? "w-7 bg-bark" : "w-2.5 bg-line hover:bg-muted"}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} className="btn-outline !px-4 !py-2" aria-label="Paket berikutnya">→</button>
      </div>
      <p className="mt-1 text-center text-xs text-muted" aria-live="polite">
        {items[active]?.name} · {active + 1}/{n} — geser atau ketuk kartu samping
      </p>
    </div>
  );
}
