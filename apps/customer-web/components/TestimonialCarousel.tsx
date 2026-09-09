"use client";

import { useState } from "react";

type T = { id: string; customer_name: string; rating: number; message: string; event_type: string | null };

// Korsel testimoni: panah + titik, satu tampil (mobile) — data asli DB.
export default function TestimonialCarousel({ items }: { items: T[] }) {
  const [i, setI] = useState(0);
  if (items.length === 0) {
    return <p className="card mt-6 text-sm text-ink/70" role="status">Testimoni pelanggan segera tampil di sini.</p>;
  }
  const t = items[i % items.length];
  return (
    <div className="mt-6">
      <figure key={t.id} className="card mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bark font-display text-2xl font-bold text-cream" aria-hidden="true">
          {t.customer_name.charAt(0)}
        </span>
        <div className="text-gold" aria-label={`Nilai ${t.rating} dari 5`}>
          {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
        </div>
        <blockquote className="font-display text-xl italic leading-relaxed">“{t.message}”</blockquote>
        <figcaption className="text-sm text-muted">
          <strong className="text-ink">{t.customer_name}</strong>
          {t.event_type ? ` · ${t.event_type}` : null}
        </figcaption>
      </figure>
      {items.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button type="button" onClick={() => setI((v) => (v - 1 + items.length) % items.length)} className="btn-outline !px-4 !py-2" aria-label="Testimoni sebelumnya">
            ←
          </button>
          <p className="text-sm text-muted" aria-live="polite">{(i % items.length) + 1} / {items.length}</p>
          <button type="button" onClick={() => setI((v) => (v + 1) % items.length)} className="btn-outline !px-4 !py-2" aria-label="Testimoni berikutnya">
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
