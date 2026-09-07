import type { Metadata } from "next";
import { APK_RELEASE, CONTACT_FALLBACK } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Aplikasi Lapangan (Android)",
  description: "Aplikasi Android tim operasional Rasa Nusantara — checklist, bukti foto, serah terima digital.",
};

const WA = `https://wa.me/${CONTACT_FALLBACK.whatsapp.replace(/\D/g, "")}`;

// Halaman demo aplikasi admin lapangan. Unduhan resmi via GitHub Releases
// (tidak ada biner palsu di repo ini).
export default function AplikasiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="kicker">Untuk tim operasional</p>
      <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Aplikasi Manajemen Katering</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Aplikasi Android asli (bukan PWA) untuk eksekusi lapangan: checklist persiapan, update status
        sekali ketuk, foto bukti, lapor insiden, dan serah terima digital — termasuk mode offline.
      </p>

      <div className="mt-6 rounded-brand border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-xl font-bold">RasaOps v{APK_RELEASE.version}</p>
            <p className="text-sm text-muted">
              {APK_RELEASE.size} · {APK_RELEASE.minAndroid} · Diperbarui {APK_RELEASE.updatedAt}
            </p>
          </div>
          <a
            className="btn-gold"
            href="https://github.com/rezzanurbaitulloh-gif/catering/releases"
            target="_blank"
            rel="noreferrer"
          >
            Unduh via GitHub Releases
          </a>
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm font-bold">Catatan rilis</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/80">
            {APK_RELEASE.changelog.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4 rounded-brand bg-cream p-4 text-sm">
          <p className="font-bold">Kredensial demo</p>
          <p className="mt-1 text-ink/70">
            Masuk dengan akun staf yang didaftarkan admin. Untuk mencoba alur pelanggan, gunakan halaman{" "}
            <a href="/lacak" className="font-bold text-gold-deep underline">Lacak Pesanan</a> dengan nomor
            acara <span className="font-mono font-bold">EVENT-2026-001</span>.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { t: "Checklist", d: "Persiapan, packing, setup — centang, foto, selesai." },
          { t: "Status 1 ketuk", d: "Tiba di venue, setup selesai, layanan selesai." },
          { t: "Offline", d: "Sinyal hilang? Data antre aman lalu tersinkron." },
        ].map((f) => (
          <div key={f.t} className="rounded-brand border border-line bg-white p-4">
            <p className="font-display font-bold">{f.t}</p>
            <p className="mt-1 text-sm text-ink/70">{f.d}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Butuh bantuan instalasi? <a className="font-bold text-gold-deep underline" href={WA} target="_blank" rel="noreferrer">Chat WhatsApp</a>
      </p>
    </div>
  );
}
