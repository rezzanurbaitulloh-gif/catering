import Link from "next/link";
import AuthArea from "./AuthArea";
import { ClocheIcon } from "./icons";
import ModeToggle from "./ModeToggle";

// Navigasi utama mengikuti mockup: Beranda, Paket, Tentang Kami, Testimoni, FAQ.
const NAV: Array<{ href: string; label: string }> = [
  { href: "/", label: "Beranda" },
  { href: "/paket", label: "Paket" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/testimoni", label: "Testimoni" },
  { href: "/faq", label: "FAQ" },
];

function Brand() {
  return (
    <Link href="/" className="touch flex items-center gap-2" aria-label="Rasa Nusantara Catering — beranda">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bark text-cream" aria-hidden="true">
        <ClocheIcon className="h-5 w-5" />
      </span>
      <span className="flex flex-col justify-center leading-none">
        <span className="font-display text-xl font-bold sm:text-2xl">RasaNusa</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold">
          Catering · Nganjuk
        </span>
      </span>
    </Link>
  );
}

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="h-1 bg-bark" aria-hidden="true" />
      <div className="container-x flex min-h-[64px] items-center justify-between gap-3 py-2">
        <Brand />
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="touch inline-flex items-center rounded-lg px-3 text-sm font-semibold text-ink/75 hover:bg-gold-soft hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Link href="/paket" className="touch hidden items-center px-2 text-ink/70 hover:text-gold-deep sm:inline-flex" aria-label="Cari paket">
            <span aria-hidden="true">⌕</span>
          </Link>
          <AuthArea />
        </div>
      </div>
      <nav aria-label="Navigasi seluler" className="border-t border-line/70 lg:hidden">
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
          <li className="shrink-0">
            <Link href="/lacak" className="touch inline-flex items-center rounded-lg px-3 text-sm font-semibold text-ink/75 hover:bg-gold-soft hover:text-ink">
              Lacak Pesanan
            </Link>
          </li>
          <li className="shrink-0">
            <Link href="/kontak" className="touch inline-flex items-center rounded-lg px-3 text-sm font-semibold text-ink/75 hover:bg-gold-soft hover:text-ink">
              Kontak
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
