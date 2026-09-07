# Naskah Demo — Rasa Nusantara Catering

Cerita 10 menit: satu alur hidup dari inquiry sampai laba.

## Pemeran & data (dari seed)

- Customer Web: http://localhost:3000 (atau URL Vercel customer)
- Admin Web: http://localhost:3001 (atau URL Vercel admin)
- Pelanggan contoh: Budi Santoso `+6281234567001`, event `EVENT-2026-001`

## Babak 1 — Pelanggan (3 mnt)

1. Buka `/paket` → pilih Paket Pernikahan Klasik → atur 500 pax + add-on Live Stall → estimasi tampil.
2. Klik booking → isi form (nama, WA, tanggal, venue) + diet: vegetarian 15, alergi udang.
3. Kirim → dapat nomor arsip inquiry.
4. Buka `/lacak` → masukkan `EVENT-2026-001` + `+6281234567001` → linimasa + pembayaran tampil.

## Babak 2 — Admin command center (4 mnt)

1. `/dashboard`: inquiry baru, EVENT-2026-002 HIGH (kekurangan ayam 15 kg, armada kosong).
2. `/risks`: baca alasan netral → klik EVENT-2026-002.
3. `/events/<id>`: kunci pax → lihat shortage → PO ayam 15 kg (SENT) → terima barang.
4. Produksi PREPARING → PRODUCING → QC → COMPLETED; packing 500/500.
5. Transport: catat berangkat → tiba + penerima + foto.
6. `/finance`: catat pelunasan → status PAID → profitabilitas (margin ±31%).

## Babak 3 — Lapangan + insiden (3 mnt)

1. APK RasaOps → Event → Tugas → centang setup + foto.
2. Operasi → Tiba → Serah terima (nama penerima + foto).
3. Insiden INC-2026-001 (2 chafing dish hilang) → INVESTIGATING → RESOLVED + bukti.
4. Rekonsiliasi: kembali 8/10 → HILANG 2 → kompensasi tercatat.

## Penutup

`/analytics`: konversi, omzet, setup tepat waktu, insiden — semua dari data nyata
yang baru dibuat. Tidak ada angka sulap.
