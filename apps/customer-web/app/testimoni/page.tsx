import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS_ID } from "@/lib/constants";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { TestimonialRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Testimoni",
  description: "Cerita pelanggan Rasa Nusantara Catering: pernikahan, korporat, pengajian, dan aqiqah.",
};

export const dynamic = "force-dynamic";

async function getTestimonials(): Promise<TestimonialRow[]> {
  const sb = createAnonServerClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("testimonials")
      .select("*")
      .eq("business_id", BUSINESS_ID)
      .eq("is_published", true)
      .order("rating", { ascending: false });
    if (error) return [];
    return (data ?? []) as TestimonialRow[];
  } catch {
    return [];
  }
}

export default async function TestimoniPage() {
  const items = await getTestimonials();
  const avg = items.length ? (items.reduce((s, t) => s + t.rating, 0) / items.length).toFixed(1).replace(".", ",") : null;
  return (
    <div className="container-x py-10">
      <p className="kicker">Bukti, Bukan Janji</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Testimoni Pelanggan</h1>
      <div className="rule-gold my-4" aria-hidden="true" />
      {items.length ? (
        <>
          <p className="text-sm text-muted" role="status">
            {items.length} ulasan · rata-rata <strong className="text-gold-deep">{avg} dari 5</strong>
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {items.map((t) => (
              <figure key={t.id} className="card">
                <div className="text-gold" aria-label={`Nilai ${t.rating} dari 5`}>
                  {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                </div>
                <blockquote className="mt-2 font-display text-xl italic leading-relaxed">“{t.message}”</blockquote>
                <figcaption className="mt-3 border-t border-line pt-3 text-sm text-muted">
                  <strong className="text-ink">{t.customer_name}</strong>
                  {t.event_type ? ` · Acara ${t.event_type}` : null}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/booking" className="btn-gold">Jadilah Cerita Berikutnya</Link>
          </div>
        </>
      ) : (
        <p className="card text-sm text-ink/70" role="status">Ulasan pelanggan segera tampil di halaman ini.</p>
      )}
    </div>
  );
}
