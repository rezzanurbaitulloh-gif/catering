import type { Metadata } from "next";
import { EmptyState } from "@/components/ui";
import { BUSINESS_ID } from "@/lib/constants";
import { createAnonServerClient } from "@/lib/supabase-server";
import type { GalleryRow } from "@/lib/types";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Dokumentasi acara, sajian prasmanan, dan penataan Rasa Nusantara Catering.",
};

export const dynamic = "force-dynamic";

async function getGalleries(): Promise<GalleryRow[]> {
  const sb = createAnonServerClient();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("galleries")
      .select("*")
      .eq("business_id", BUSINESS_ID)
      .order("sort", { ascending: true });
    if (error) return [];
    return (data ?? []) as GalleryRow[];
  } catch {
    return [];
  }
}

export default async function GaleriPage() {
  const items = await getGalleries();
  return (
    <div className="container-x py-10">
      <p className="kicker">Dokumentasi</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Galeri Acara</h1>
      <div className="rule-gold my-4" aria-hidden="true" />
      {items.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((g) => (
            <li key={g.id}>
              <figure className="card overflow-hidden !p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image_url} alt={g.caption ?? "Dokumentasi acara Rasa Nusantara Catering"} loading="lazy" className="aspect-[4/3] w-full bg-line object-cover" />
                {g.caption ? <figcaption className="px-4 py-3 text-sm text-ink/75">{g.caption}</figcaption> : null}
              </figure>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Galeri segera hadir"
          body="Tim kami sedang merapikan dokumentasi acara terbaru. Sementara itu, lihat paket dan harga atau sapa kami via WhatsApp."
          actionHref="/paket"
          actionLabel="Lihat Paket"
        />
      )}
    </div>
  );
}
