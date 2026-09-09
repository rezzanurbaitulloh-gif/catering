-- Catering OS · 0007_venue_showcase
-- Etalase venue publik (nama/alamat/kontak untuk pemasaran, seperti halaman venue).

drop policy if exists venues_public_read on public.venues;
create policy venues_public_read on public.venues for select to anon using (true);
