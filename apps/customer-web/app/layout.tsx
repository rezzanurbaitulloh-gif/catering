import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CONTACT_FALLBACK, SITE } from "@/lib/constants";
import { waLink } from "@/lib/format";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.short}`,
  },
  description: SITE.description,
  keywords: ["katering nganjuk", "catering pernikahan", "prasmanan", "nasi box", "katering korporat", "katering pengajian"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wa = waLink(CONTACT_FALLBACK.whatsapp, "Halo Rasa Nusantara Catering, saya ingin bertanya.");
  return (
    <html lang="id">
      <body className="font-body">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-cream"
        >
          Lewati ke konten
        </a>
        <SiteHeader />
        <main id="konten" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter />
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat WhatsApp Rasa Nusantara Catering"
          className="touch fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
        >
          <span aria-hidden="true">✦</span> WhatsApp
        </a>
      </body>
    </html>
  );
}
