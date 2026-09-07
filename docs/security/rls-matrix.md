# Matriks Keamanan — Catering OS

## Prinsip

1. Tenant isolation: semua baris bisnis punya `business_id`; RLS `is_member()` / parent-join.
2. UI hiding ≠ security: capability dicek ulang di API route (`requireCap`) + RLS.
3. Uang & porsi dihitung server: API routes + Edge Function `calc-quote`.
4. Quote approved immutable: trigger `lock_approved_quote_version`.
5. Transisi valid: trigger `assert_event_transition` + mesin di semua klien.
6. Jejak audit: trigger `write_audit` (quotes, payments, refunds, events, inventory, incidents).

## Kebijakan baca publik (anon)

| Tabel | anon SELECT | anon INSERT | Catatan |
|---|---|---|---|
| packages, menu_items, galleries, testimonials, website_content | ✅ | ❌ | katalog & konten |
| inquiries, complaints | ❌ | ✅ | akuisisi pelanggan |
| lainnya | ❌ | ❌ | butuh auth + membership |

## Endpoint privat & penjagaan

| Route | Auth | Capability | Validasi |
|---|---|---|---|
| POST /api/inquiries (customer) | anon | — | zod ID (HP, pax, diet) |
| GET /api/track | service (server) | — | cocok nomor HP pemilik |
| POST /api/quotes | JWT | — | hitung server, diskon ≤ subtotal |
| POST /api/quotes/:id/approve | JWT | — | mesin Quote |
| POST /api/events/:id/transition | JWT | — | mesin Event (+ trigger DB) |
| POST /api/events/:id/pax-lock | JWT | — | PLANNING/LOCKED saja |
| POST /api/payments | JWT | — | hitung ulang status |
| POST /api/ops/production | JWT | — | mesin Production |
| POST /api/incidents* | JWT | — | mesin Incident |
| POST /api/change-requests/:id/apply | JWT | change_request | APPROVED saja |
| GET /api/risks | JWT | risk_engine | — |
| GET profitability | JWT | profitability | — |

## Rahasia

- `SUPABASE_SERVICE_ROLE_KEY`: hanya env server (Vercel env / `.env` lokal), tanpa prefix `NEXT_PUBLIC_`, tidak pernah ke browser/repo.
- Kredensial demo & kunci di `.env.example` = placeholder.
- Bukti operasional di bucket Storage privat `evidence`/`documents` (signed URL); publik hanya `gallery`/`menu`.

## Uji yang harus lolos (§65.10)

`cross-tenant access prevention`: user bisnis A tidak bisa baca/tulis baris bisnis B
(RLS menolak) — diverifikasi manual via dua akun pada fase hardening.
