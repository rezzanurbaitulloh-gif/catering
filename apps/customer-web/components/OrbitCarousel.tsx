"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatIDR } from "@/lib/format";
import type { PackageRow } from "@/lib/types";

// Orbit carousel: paket mengelilingi titik tengah (pusat = paket aktif).
// Putar otomatis + seret + tombol + titik. Hormat reduced-motion.
export default function OrbitCarousel({ items }: { items: PackageRow[] }) {
  const n = items.length;
  const boxRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const angle = useRef(0);
  const target = useRef<number | null>(null);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const resumeAt = useRef(0);
  const autoPaused = useRef(false);
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const activeRef = useRef(0);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const layout = useCallback(() => {
    const box = boxRef.current;
    if (!box || !n) return;
    const W = box.clientWidth;
    const H = box.clientHeight;
    const cx = W / 2;
    const cy = H / 2;
    const rx = Math.min(W * 0.36, 300);
    const ry = Math.min(H * 0.32, 150);
    let best = 0;
    let bestDepth = -Infinity;
    for (let i = 0; i < n; i++) {
      const el = nodeRefs.current[i];
      if (!el) continue;
      const a = angle.current + (i * 2 * Math.PI) / n;
      const depth = Math.sin(a); // +1 depan, -1 belakang
      const x = cx + rx * Math.cos(a);
      const y = cy + ry * Math.sin(a);
      const s = 0.52 + 0.48 * ((depth + 1) / 2);
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${s.toFixed(3)})`;
      el.style.zIndex = String(Math.round(10 + depth * 9));
      el.style.opacity = depth < -0.55 ? "0.35" : "1";
      el.style.filter = depth < 0 ? "saturate(0.8)" : "none";
      if (depth > bestDepth) {
        bestDepth = depth;
        best = i;
      }
    }
    if (best !== activeRef.current) {
      activeRef.current = best;
      setActive(best);
    }
  }, [n]);

  useEffect(() => {
    if (!n || reduced) {
      layout();
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const paused = autoPaused.current || dragging.current || now < resumeAt.current;
      if (target.current != null) {
        // Gerak mulus menuju sudut target (snap).
        const diff = target.current - angle.current;
        const step = diff * Math.min(1, dt * 6);
        angle.current += step;
        if (Math.abs(diff) < 0.002) {
          angle.current = target.current;
          target.current = null;
        }
      } else if (!paused) {
        angle.current += dt * 0.35;
      }
      layout();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [n, reduced, layout]);

  function snapTo(i: number) {
    // Putar agar node i ke depan (sudut depan = PI/2).
    const want = Math.PI / 2 - (i * 2 * Math.PI) / n;
    const twoPi = 2 * Math.PI;
    let cur = angle.current % twoPi;
    let diff = (want - cur) % twoPi;
    if (diff > Math.PI) diff -= twoPi;
    if (diff < -Math.PI) diff += twoPi;
    target.current = angle.current + diff;
    resumeAt.current = performance.now() + 5000;
  }

  if (!n) return null;
  const cur = items[active] ?? items[0];

  return (
    <div
      onMouseEnter={() => { autoPaused.current = true; }}
      onMouseLeave={() => { autoPaused.current = false; }}
      onFocus={() => { autoPaused.current = true; }}
      onBlur={() => { autoPaused.current = false; }}
    >
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Panel tengah: paket aktif */}
        <div className="order-2 text-center lg:order-1 lg:text-left" aria-live="polite">
          <p className="font-script text-3xl text-gold-deep">Pilihan {active + 1} dari {n}</p>
          <h3 className="display-tight mt-1 font-display text-3xl font-semibold italic text-bark-ink sm:text-4xl">
            {cur.name}
          </h3>
          <p className="mt-2 font-display text-2xl font-bold text-bark-deep">
            {formatIDR(cur.base_price_per_pax)}
            <span className="font-body text-sm font-normal text-muted"> /pax · Min. {cur.min_pax}</span>
          </p>
          {cur.description ? <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/70 lg:mx-0">{cur.description}</p> : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:justify-start justify-center">
            <Link href={`/paket/${cur.id}`} className="btn-gold !rounded-full">
              Lihat &amp; Hitung
            </Link>
            <Link href="/paket" className="touch inline-flex items-center justify-center rounded-full border border-bark-ink/25 px-6 py-3 text-base font-semibold text-bark-ink hover:bg-bark-ink hover:text-cream">
              Semua Paket
            </Link>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 lg:justify-start">
            <button type="button" onClick={() => snapTo((active - 1 + n) % n)} className="btn-outline !rounded-full !px-4 !py-2 text-sm" aria-label="Paket sebelumnya">←</button>
            <div className="flex gap-1.5" role="tablist" aria-label="Pilih paket">
              {items.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={p.name}
                  onClick={() => snapTo(i)}
                  className={`h-2.5 rounded-full transition-all ${i === active ? "w-7 bg-bark" : "w-2.5 bg-line hover:bg-muted"}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => snapTo((active + 1) % n)} className="btn-outline !rounded-full !px-4 !py-2 text-sm" aria-label="Paket berikutnya">→</button>
          </div>
        </div>
        {/* Arena orbit */}
        <div
          ref={boxRef}
          className="relative order-1 mx-auto h-[320px] w-full max-w-[560px] touch-pan-y select-none sm:h-[380px] lg:order-2"
          style={{ perspective: "900px" }}
          role="region"
          aria-roledescription="carousel"
          aria-label="Paket mengorbit — seret untuk memutar"
          onPointerDown={(e) => {
            dragging.current = true;
            lastX.current = e.clientX;
            target.current = null;
            setHeld(true);
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            angle.current += ((e.clientX - lastX.current) / 220) * -1;
            lastX.current = e.clientX;
            layout();
          }}
          onPointerUp={() => {
            dragging.current = false;
            setHeld(false);
            resumeAt.current = performance.now() + 4000;
          }}
          onPointerCancel={() => {
            dragging.current = false;
            setHeld(false);
          }}
        >
          {/* Titik tengah */}
          <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gold/50" aria-hidden="true" />
          <span className="absolute left-1/2 top-1/2 h-[210px] w-[300px] max-w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/30" aria-hidden="true" />
          {/* Foto paket aktif di pusat orbit */}
          <span className="absolute left-1/2 top-1/2 block h-40 w-40 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-[6px] border-white bg-gold-soft shadow-2xl sm:h-48 sm:w-48" aria-hidden="true">
            {cur.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={cur.id} src={cur.image_url} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-5xl font-bold text-bark">
                {cur.name.charAt(0)}
              </span>
            )}
          </span>
          {items.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              type="button"
              onClick={() => snapTo(i)}
              aria-label={`Tampilkan ${p.name}`}
              className="absolute left-0 top-0 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gold-soft shadow-xl transition-shadow hover:shadow-2xl sm:h-28 sm:w-28"
              style={{ cursor: held ? "grabbing" : "grab", willChange: "transform" }}
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" aria-hidden="true" loading="eager" draggable={false} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-bark" aria-hidden="true">
                  {p.name.charAt(0)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted">Seret orbit untuk memutar · ketuk paket untuk fokus · {active + 1}/{n}</p>
    </div>
  );
}
