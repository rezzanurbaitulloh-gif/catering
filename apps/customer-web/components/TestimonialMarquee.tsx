"use client";

// Marquee testimoni ala Just Essence: mengalir, jeda saat disentuh/hover.
export default function TestimonialMarquee({
  items,
}: {
  items: Array<{ id: string; customer_name: string; rating: number; message: string; event_type: string | null }>;
}) {
  if (!items.length) {
    return <p className="card mt-6 text-sm text-ink/70" role="status">Testimoni pelanggan segera tampil di sini.</p>;
  }
  const row = [...items, ...items];
  return (
    <div className="marquee mt-6 overflow-hidden" aria-label="Testimoni pelanggan">
      <div className="marquee-track flex w-max gap-4">
        {row.map((t, i) => (
          <figure key={`${t.id}-${i}`} className="card w-72 shrink-0 !p-4" aria-hidden={i >= items.length}>
            <div className="text-gold" aria-label={`Nilai ${t.rating} dari 5`}>
              {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
            </div>
            <blockquote className="mt-2 line-clamp-4 font-display text-base italic leading-relaxed">“{t.message}”</blockquote>
            <figcaption className="mt-2 flex items-center gap-2 text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bark font-bold text-cream" aria-hidden="true">
                {t.customer_name.charAt(0)}
              </span>
              <span>
                <strong className="block text-[13px]">{t.customer_name}</strong>
                {t.event_type ? <span className="block text-xs text-muted">{t.event_type}</span> : null}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
