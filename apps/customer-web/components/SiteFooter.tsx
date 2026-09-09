import Link from "next/link";
import { CONTACT_FALLBACK, PAYMENT_INFO } from "@/lib/constants";
import { waLink } from "@/lib/format";

// Footer cokelat gelap: Menu / Layanan / Kontak (mengikuti mockup).
export default function SiteFooter() {
  const wa = waLink(CONTACT_FALLBACK.whatsapp, "Halo Rasa Nusantara Catering, saya ingin bertanya.");
  return (
    <footer className="mt-16 bg-bark-ink text-cream/90">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl font-bold text-cream">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream/10 text-lg" aria-hidden="true">🍽</span>
            RasaNusa
          </p>
          <p className="mt-2 text-sm leading-relaxed text-cream/70">
            Catering dengan cita rasa dan ketepatan waktu untuk setiap hajatan.
          </p>
        </div>
        <nav aria-label="Menu bawah">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Menu</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              ["/paket", "Paket"],
              ["/booking", "Pesan"],
              ["/lacak", "Lacak Pesanan"],
              ["/galeri", "Galeri"],
              ["/testimoni", "Testimoni"],
              ["/faq", "FAQ"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="touch inline-flex items-center py-1 text-cream/80 hover:text-cream">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Layanan bawah">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Layanan</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {[
              ["/paket?kat=Prasmanan", "Prasmanan"],
              ["/paket?kat=Nasi+Box", "Nasi Box"],
              ["/paket?kat=Pengajian", "Pengajian"],
              ["/paket?kat=Premium", "Premium"],
              ["/aplikasi", "Aplikasi Lapangan"],
              ["/akun", "Akun Saya"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="touch inline-flex items-center py-1 text-cream/80 hover:text-cream">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-caramel">Kontak</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed text-cream/75">
            {CONTACT_FALLBACK.phone}
            <br />
            {CONTACT_FALLBACK.email}
            <br />
            {CONTACT_FALLBACK.address}
          </address>
          <p className="mt-2 text-sm text-cream/75">{CONTACT_FALLBACK.hours} · {PAYMENT_INFO.dp}</p>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4 text-sm">
            Chat WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <p className="container-x py-4 text-xs text-cream/60">
          © 2026 Rasa Nusantara Catering, Nganjuk — Jawa Timur. Harga mengikuti penawaran resmi tertulis.
        </p>
      </div>
    </footer>
  );
}
