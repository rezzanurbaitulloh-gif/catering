# Laporan Akhir V2 — Catering OS (2026-09-08)

## IMPLEMENTED
- Customer Auth: daftar/masuk/keluar/sesi-persist/profil+alamat/lupa+reset sandi (bug sesi hilang antar-halaman ditemukan E2E → diperbaiki)
- RLS portal: customers.auth_user_id + 9 policy milik-sendiri (0003) + baca operasional (0004)
- Dashboard portal: progres 11 tahap, tagihan, invoice, riwayat, notifikasi, CR customer, komplain
- Checkout auth: quote APPROVED → klaim via HP → event+booking idempoten (server-side, tanpa percaya client)
- Invoice: nomor INV-*, dari versi terkunci + kas append-only, QR verifikasi, cetak/PDF
- Print: invoice/penawaran/brief + gaya print; QR packing di control center
- Admin Customer 360, halaman Notifikasi + engine H-7/H-3/H-1/T-2h/eskalasi (idempoten; live: checked 5, created 1)
- Deteksi konflik armada & peralatan tanggal-sama
- Toggle mode publik + realtime dua arah (akar masalah cache basi Vercel→Supabase ditemukan & diobati anti-cache)
- Seed F (Midtrans pending), G (failed), CR pending, event_types publik
- E2E: API 14/14, browser customer 10/10, auth 2/2, admin 4/4, unit 17/17, flutter analyze bersih + 2/2
- Realtime crash StrictMode (channel reuse) ditemukan E2E → diperbaiki (channel unik)
- Push protection incident: scripts/.e2e.env sempat ter-commit → dibatalkan sebelum push lolos (secret tidak pernah bocor ke remote)

## VERIFIED
Lihat IMPLEMENTED (semua diverifikasi browser/API/live, bukan sekadar compile).
Visual QA: screenshot home, daftar, profil, dashboard admin, events — editorial, tanpa overflow mobile.

## PARTIAL
- Quote approve via link publik (tanpa login): tetap terbuka, UUID tak tertebak; checkout-nya yang wajib login
- Post-event report: tercakup parsial via profitabilitas + audit + rekonsiliasi (belum satu dokumen rekap)
- Skenario H (offline): mekanisme teruji unit + UI banner, belum di perangkat fisik

## KNOWN ISSUES
- Midtrans production keys DITOLAK Midtrans ("Access denied") — diverifikasi via curl langsung; masalah sisi akun MAP, bukan kode. Webhook positif teruji dengan signature hitung-sendiri (PAID + replay idempoten PASS)
- Flaky E2E di RAM 4GB bila dev server + test paralel (solusi: serial, timeout 120s)
- Vercel CLI upload 289MB bila workdir salah / .next ikut (solusi: .vercelignore + CWD benar)

## SECURITY
- RLS diuji +/- (anon ditolak, pemilik lolos, silang 404); service key hanya server; tidak ada secret di repo (1 insiden dicegah push protection); signature webhook diverifikasi; nominal dari server

## E2E
- Customer: browse→booking→lacak + register→dashboard→profil→alamat→logout→login PASS (browser nyata)
- Admin: login demo→dashboard→control center→risks→toggle PASS
- APK: audit statik (2 bug diperbaiki), crash realtime tidak ada; kamera/offline/QR perangkat = BLOCKED (tanpa perangkat)

## PAYMENT
Midtrans Snap terintegrasi penuh (charge/server-hitung-sisa, notify terverifikasi, halaman redirect sudah dipasang di kode). Tunggu key valid dari dashboard MAP. Link redirect ada di laporan chat.

## DATA
Seed relasional Indonesia; skenario A–G live; test-data selalu dibersihkan (audit: 0 residu E2E/API/PW).

## PRODUCTION READINESS: READY dengan 2 catatan
1. Ganti/rotasi kredensial demo (admin & tim) + kunci Midtrans valid
2. APK v1.2.0 di Release tertinggal 2 perbaikan kecil (interpolasi home, empty state) — rebuild saat giliran APK
