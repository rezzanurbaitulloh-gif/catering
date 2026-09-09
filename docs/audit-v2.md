# Audit V2 — Catering OS (2026-09-08)

Sumber: inspeksi repo + build + live test, bukan klaim README.

| Fitur | UI | Backend | DB | Auth | RLS | E2E | Status |
|---|---|---|---|---|---|---|---|
| Katalog/landing publik | ✅ | ✅ | ✅ | n/a | ✅ | ✅live | DONE |
| Inquiry anon | ✅ | ✅ | ✅ | n/a | ✅ | ✅live 201 | DONE |
| Customer register/login/logout/profil/lupa | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | MISSING (P0) |
| Customer dashboard portal | ⚠️/akun phone-lookup | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | PARTIAL (P0) |
| Checkout auth (final order) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | MISSING (P0) |
| Quote approve/versioning | ✅ | ✅ | ✅ | ⚠️link-tanpa-auth | ✅member | ⚠️ | PARTIAL→auth (P0) |
| Midtrans charge/notify/status | ✅ | ✅ | ✅ | n/a | ✅service | ❌ | IMPLEMENTED+NOT VERIFIED (key ditolak Midtrans = BLOCKED eksternal) |
| Invoice view/print | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | MISSING (P0) |
| Tracking timeline | ✅ | ✅ | ✅ | n/a | ✅service+phone | ✅live | DONE |
| Change request (admin) | ✅ | ✅ | ✅ | ✅admin | ✅ | ⚠️ | DONE-ish |
| Change request (customer) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | MISSING (P0) |
| Pax lock + revisi | ✅ | ✅ | ✅ | ✅admin | ✅ | ⚠️unit | PARTIAL→E2E (P1) |
| Production/BOM/inventory/procurement | ✅ | ✅ | ✅ | ✅admin | ✅ | ⚠️ | PARTIAL→E2E (P1) |
| Shortage→PO→receiving | ⚠️manual | ✅ | ✅ | ✅ | ✅ | ❌ | PARTIAL (P1) |
| Konflik resource (staf tanggal) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | DONE-ish |
| Konflik armada/peralatan same-date | ❌ | ❌ | ❌ | — | — | ❌ | MISSING (P1, warning saja) |
| Risk center | ✅ | ✅ | ✅ | ✅admin | ✅ | ✅live | DONE |
| Print/PDF dokumen | ❌ | ❌ | — | — | — | ❌ | MISSING (P1) |
| QR dokumen | ❌ | ❌ | — | — | — | ❌ | MISSING (P1, mobile scan DONE) |
| Notifikasi engine H-7/H-3/H-1 | ❌ | ❌ | ✅tabel | ❌ | ❌ | ❌ | MISSING (P1) |
| Admin customer 360 | ❌ | ⚠️ | ✅ | ✅ | ✅ | ❌ | PARTIAL (P1) |
| Profitabilitas + lap. pasca-event | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ | PARTIAL (P1) |
| Mode Basic/Premium publik+realtime | ✅ | ✅ | ✅ | n/a | ✅ | ✅live | DONE |
| Alamat customer vs venue snapshot | ⚠️tabel saja | ❌ | ✅ | ❌ | ❌ | ❌ | PARTIAL (P0) |
| APK:nav/task/ops/handover/notif | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️static | PARTIAL (device BLOCKED) |
| APK:kamera/bukti | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ | NOT VERIFIED (device BLOCKED) |
| APK:offline/sync | ✅ | ✅ | ✅ | — | — | ⚠️unit | NOT VERIFIED (device BLOCKED) |
| Demo relasional ID | ✅ | ✅ | ✅ | — | — | ✅ | DONE |
| Demo skenario F/G/H | ⚠️ | ⚠️ | ⚠️ | — | — | ❌ | PARTIAL (P1) |
| Analytics real-data | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | DONE-ish |

Keputusan: P0 = auth customer + dashboard + invoice + checkout + alamat + CR customer. P1 = print/QR/notif/360/konflik-armada/seed/E2E. APK device = BLOCKED (jujur di laporan).
