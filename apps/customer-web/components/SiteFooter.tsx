import Link from "next/link";
import { CONTACT_FALLBACK, PAYMENT_INFO } from "@/lib/constants";
import { waLink } from "@/lib/format";

export default function SiteFooter() {
  const wa = waLink(CONTACT_FALLBACK.whatsapp, "Halo Rasa Nusantara Catering, saya ingin bertanya.");
  return (
    <footer className="mt-16 bg-night text-cream/90">
      <div className="container-x grid gap-10 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-bold text-cream">Rasa Nusantara</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-gold-soft">
            Catering · Nganjuk
          </p>
          <address className="mt-4 text-sm not-italic leading-relaxed text-cream/75">
            {CONTACT_FALLBACK.address}
            <br />
            Telp: {CONTACT_FALLBACK.phone}
            <br />
            Email: {CONTACT_FALLBACK.email}
          </address>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gold-soft">Jam &amp; Pembayaran</h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/75">{CONTACT_FALLBACK.hours}</p>
          <ul className="mt-3 space-y-1 text-sm text-cream/75">
            <li>Transfer: {PAYMENT_INFO.transfer}</li>
            <li>{PAYMENT_INFO.qris}</li>
            <li className="font-semibold text-cream">{PAYMENT_INFO.dp}</li>
          </ul>
        </div>
        <nav aria-label="Navigasi bawah">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-gold-soft">Jelajah</h2>
          <ul className="mt-3 grid grid-cols-2 gap-1 text-sm">
            {[
              ["/paket", "Paket"],
              ["/booking", "Pesan / Tanya"],
              ["/lacak", "Lacak Pesanan"],
              ["/akun", "Akun Saya"],
              ["/galeri", "Galeri"],
              ["/testimoni", "Testimoni"],
              ["/tentang", "Tentang"],
              ["/aplikasi", "Aplikasi Lapangan"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="touch inline-flex items-center py-1 text-cream/80 hover:text-gold-soft">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold mt-4 !bg-gold text-sm">
            Chat WhatsApp
          </a>
        </nav>
      </div>
      <div className="border-t border-cream/15">
        <p className="container-x py-4 text-xs text-cream/60">
          © 2026 Rasa Nusantara Catering, Nganjuk — Jawa Timur. Harga dapat berubah mengikuti penawaran resmi tertulis.
        </p>
      </div>
    </footer>
  );
}
