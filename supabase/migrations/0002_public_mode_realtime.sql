-- Catering OS · 0002_public_mode_toggle + realtime
-- Atas permintaan pemilik: toggle Basic/Premium boleh diubah SIAPA PUN (termasuk
-- pengunjung anonim) dari web mana pun, dan semua web ikut berubah (realtime).
-- CATATAN: ini membuka tulis anon ke business_capabilities. Untuk produksi
-- serius, batasi ke business tertentu / tambah verifikasi (lihat docs/security).

-- 1. anon boleh UPDATE enabled di business_capabilities
drop policy if exists anon_toggle_mode on public.business_capabilities;
create policy anon_toggle_mode on public.business_capabilities
  for update to anon using (true) with check (true);

-- anon boleh baca (agar badge/mode tampil tanpa login)
drop policy if exists anon_read_caps on public.business_capabilities;
create policy anon_read_caps on public.business_capabilities
  for select to anon using (true);

-- 2. realtime publication untuk sinkronisasi mode + operasi ke semua klien
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'business_capabilities'
  ) then
    alter publication supabase_realtime add table public.business_capabilities;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payments'
  ) then
    alter publication supabase_realtime add table public.payments;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'incidents'
  ) then
    alter publication supabase_realtime add table public.incidents;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
