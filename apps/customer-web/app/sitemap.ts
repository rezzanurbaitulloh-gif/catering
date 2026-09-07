import type { MetadataRoute } from "next";
import { BUSINESS_ID } from "@/lib/constants";
import { createAnonServerClient } from "@/lib/supabase-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = ["", "/paket", "/tentang", "/galeri", "/testimoni", "/kontak", "/booking", "/lacak", "/akun", "/aplikasi"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${siteUrl}${r || "/"}`,
    lastModified: now,
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
  try {
    const sb = createAnonServerClient();
    if (sb) {
      const { data } = await sb.from("packages").select("id").eq("business_id", BUSINESS_ID).eq("is_active", true);
      const ids = ((data ?? []) as Array<{ id: string }>).map((d) => d.id);
      for (const id of ids) {
        urls.push({ url: `${siteUrl}/paket/${id}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
      }
    }
  } catch {
    // sitemap tetap valid dengan rute statis
  }
  return urls;
}
