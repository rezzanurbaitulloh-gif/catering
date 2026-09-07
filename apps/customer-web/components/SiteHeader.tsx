import Link from "next/link";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/paket", label: "Paket" },
  { href: "/tentang", label: "Tentang" },
  { href: "/galeri", label: "Galeri" },
  { href: "/testimoni", label: "Testimoni" },
  { href: "/lacak", label: "Lacak Pesanan" },
  { href: "/kontak", label: "Kontak" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="h-1 bg-gold" aria-hidden="true" />
      <div className="container-x flex min-h-[64px] items-center justify-between gap-3 py-2">
        <Link href="/" className="touch flex flex-col justify-center leading-none" aria-label="Rasa Nusantara Catering — beranda">
          <span className="font-display text-xl font-bold sm:text-2xl">
            Rasa Nusantara
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
            Catering · Nganjuk
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/akun" className="touch hidden items-center px-3 text-sm font-semibold text-ink/80 hover:text-gold-deep sm:inline-flex">
            Akun Saya
          </Link>
          <Link href="/booking" className="btn-gold !px-5 !py-2.5 text-sm">
            Minta Penawaran
          </Link>
        </div>
      </div>
      <nav aria-label="Navigasi utama" className="border-t border-line/70">
        <ul className="container-x flex gap-1 overflow-x-auto py-1">
          {NAV.map((n) => (
            <li key={n.href} className="shrink-0">
              <Link
                href={n.href}
                className="touch inline-flex items-center rounded-lg px-3 text-sm font-semibold text-ink/75 hover:bg-gold-soft hover:text-ink"
              >
                {n.label}
              </Link>
            </li>
          ))}
          <li className="shrink-0 sm:hidden">
            <Link href="/akun" className="touch inline-flex items-center rounded-lg px-3 text-sm font-semibold text-ink/75 hover:bg-gold-soft hover:text-ink">
              Akun Saya
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
