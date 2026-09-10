-- Catering OS · 0008_promo_publik
-- Kode promo aktif boleh dibaca publik (pita promo katalog).

drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read on public.promotions
  for select to anon using (is_active = true);
