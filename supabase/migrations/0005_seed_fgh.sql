-- Catering OS · 0005_seed_FGH + katalog publik
-- Skenario demo: F (Midtrans pending), G (gagal/expired), H (dicatat di mobile),
-- CR pending 300→350, katalog event_types publik.

-- event_types boleh dibaca anon (form booking publik)
drop policy if exists event_types_public_read on public.event_types;
create policy event_types_public_read on public.event_types for select to anon using (true);

-- F: pembayaran Midtrans menunggu (EVENT-2026-002, gathering)
insert into public.payments (business_id, event_id, amount, method, kind, status, reference) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000002',6300000,'MIDTRANS-QRIS','DP','PENDING','RN-ORDER-PENDING-001')
on conflict do nothing;

-- G: pembayaran gagal/kedaluwarsa (EVENT-2026-004)
insert into public.payments (business_id, event_id, amount, method, kind, status, reference) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000004',4000000,'MIDTRANS-VA','DP','FAILED','RN-ORDER-EXPIRED-001')
on conflict do nothing;

-- C (pending): change request 300 → 350 pax menunggu persetujuan (EVENT-2026-002)
insert into public.change_requests (business_id, event_id, type, payload, impact, status) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000002','PAX',
   '{"old_pax": 300, "new_pax": 350, "note": "Tambahan karyawan baru"}',
   '{"price_delta": 1400000, "staffing_delta": 1, "vehicle_ok": true, "equipment_ok": true, "timeline_ok": true, "availability_ok": true, "profit_delta": 560000}',
   'PENDING')
on conflict do nothing;

-- E: testimoni/feedback pasca-event (EVENT-2026-007)
insert into public.testimonials (business_id, customer_name, rating, message, event_type) values
  ('11111111-1111-1111-1111-111111111111','PT Maju Jaya Abadi',4,'Raker lancar, nasi box datang 30 menit lebih awal. Parkir armada sempat sempit tapi teratasi.','Korporat')
on conflict do nothing;

-- Notifikasi contoh (agar kotak masuk tidak kosong saat demo notifikasi)
insert into public.notifications (business_id, kind, title, body, event_id) values
  ('11111111-1111-1111-1111-111111111111','PAX_H7','H-7 EVENT-2026-002: pax belum dikunci','Gathering PT Maju Jaya — hubungi pelanggan untuk final pax sebelum belanja.','10000000-0000-0000-0000-000000000002')
on conflict do nothing;
