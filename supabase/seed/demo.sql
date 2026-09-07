-- Catering OS · demo seed (idempotent via fixed UUIDs + ON CONFLICT DO NOTHING)
-- Business: Rasa Nusantara Catering (Nganjuk, Jawa Timur) — full premium capabilities.

-- business
insert into public.businesses (id, name, slug, currency) values
  ('11111111-1111-1111-1111-111111111111', 'Rasa Nusantara Catering', 'rasa-nusantara', 'IDR')
on conflict (id) do nothing;

insert into public.business_settings (business_id, address, phone, whatsapp, email, operating_hours, payment_info) values
  ('11111111-1111-1111-1111-111111111111', 'Jl. A. Yani No. 88, Nganjuk, Jawa Timur',
   '(0358) 321-456', '+6281234567890', 'halo@rasanusantara.id',
   '{"senin-sabtu": "08.00-20.00", "minggu": "09.00-17.00"}',
   '{"transfer": "BCA 1234567890 a.n. Rasa Nusantara", "qris": "QRIS Rasa Nusantara", "dp": "DP minimal 30%"}')
on conflict (business_id) do nothing;

-- all capabilities on (premium demo)
insert into public.business_capabilities (business_id, capability, enabled)
select '11111111-1111-1111-1111-111111111111', c, true from (values
  ('basic_orders'),('customer_management'),('package_management'),('event_management'),
  ('basic_finance'),('basic_staff'),('basic_checklists'),('basic_notifications'),('basic_incidents'),
  ('crm'),('advanced_quotation'),('quotation_versioning'),('quote_approval'),('change_request'),
  ('customer_accounts'),('online_payment'),('dynamic_pricing'),('promotions'),('coupons'),
  ('production_planning'),('recipe_bom'),('inventory'),('procurement'),('suppliers'),
  ('workforce_management'),('vehicle_management'),('equipment_tracking'),('resource_capacity'),
  ('venue_management'),('transport_management'),('advanced_event_control'),('risk_engine'),
  ('advanced_incident_management'),('advanced_finance'),('costing'),('profitability'),
  ('advanced_analytics'),('exports'),('offline_sync'),('qr_scanning'),('digital_handover')
) t(c)
on conflict do nothing;

insert into public.event_types (id, business_id, name) values
  ('e0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Pernikahan'),
  ('e0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Korporat'),
  ('e0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Pengajian'),
  ('e0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Aqiqah')
on conflict (id) do nothing;

insert into public.venues (id, business_id, name, address, contact_name, contact_phone, access_notes, parking_notes, power_notes) values
  ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Gedung Serbaguna Nganjuk','Jl. Veteran No. 12, Nganjuk','Pak Sutrisno','+6281330001111',
   'Akses loading via pintu barat, lebar 3m','Parkir 200 mobil + area bus','Listrik 5500W, genset wajib untuk sound'),
  ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
   'Balai Desa Sukomoro','Ds. Sukomoro, Nganjuk','Bu Lurah Ani','+6281330002222',
   'Gang sempit, maksimal armada engkel','Parkir lapangan desa','Listrik 2200W')
on conflict (id) do nothing;

insert into public.menu_items (id, business_id, name, category) values
  ('b0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Nasi Putih','Pokok'),
  ('b0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Ayam Lodho Khas Nganjuk','Utama'),
  ('b0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Rendang Sapi','Utama'),
  ('b0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Soto Ayam Lamongan','Sup'),
  ('b0000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Gurame Bakar','Utama'),
  ('b0000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','Es Dawet Ayu','Dessert'),
  ('b0000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','Krupuk Udang','Pelengkap')
on conflict (id) do nothing;

insert into public.packages (id, business_id, name, description, base_price_per_pax, min_pax, max_pax, is_active) values
  ('c0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Paket Pernikahan Klasik','Prasmanan lengkap + dessert + 2x snack box keluarga. Favorit Nganjuk.',55000,200,1000,true),
  ('c0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',
   'Paket Korporat Hemat','Nasi box + snack, cocok gathering & rapat kantor.',28000,50,2000,true),
  ('c0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111',
   'Paket Pengajian Berkah','Menu rumahan hangat untuk pengajian & tasyakuran.',32000,50,1500,true),
  ('c0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111',
   'Paket Premium Nusantara','Live stall gurame bakar + carving buah + premium dessert.',95000,150,800,true)
on conflict (id) do nothing;

insert into public.package_items (package_id, menu_item_id, name, qty_per_pax, unit) values
  ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001','Nasi Putih',1,'porsi'),
  ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002','Ayam Lodho',1,'porsi'),
  ('c0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000006','Es Dawet Ayu',1,'gelas'),
  ('c0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000001','Nasi Putih',1,'box'),
  ('c0000000-0000-0000-0000-000000000004','b0000000-0000-0000-0000-000000000005','Gurame Bakar',1,'porsi')
on conflict do nothing;

insert into public.package_addons (package_id, name, price, per_pax) values
  ('c0000000-0000-0000-0000-000000000001','Live Stall Soto Lamongan',8000,true),
  ('c0000000-0000-0000-0000-000000000001','Dekorasi Rustic Jawa',2500000,false),
  ('c0000000-0000-0000-0000-000000000002','Snack Box Tambahan',12000,false)
on conflict do nothing;

insert into public.ingredients (id, business_id, name, unit, sku) values
  ('d0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Ayam Kampung','kg','AYM-KPG'),
  ('d0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Beras Premium','kg','BRS-PRM'),
  ('d0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Daging Sapi','kg','DGG-SPI'),
  ('d0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Santan Kelapa','liter','STN-KLP')
on conflict (id) do nothing;

-- Ayam Lodho: 0.07 kg ayam per porsi → 500 pax = 35 kg (stock 20 kg → shortage 15 kg demo)
insert into public.recipes (id, business_id, menu_item_id, name, yield_qty, yield_unit) values
  ('d0000000-0000-0000-0000-000000000011','11111111-1111-1111-1111-111111111111','b0000000-0000-0000-0000-000000000002','Ayam Lodho (batch dapur)',100,'porsi')
on conflict (id) do nothing;
insert into public.recipe_items (recipe_id, ingredient_id, qty_per_yield, unit) values
  ('d0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000001',7,'kg'),
  ('d0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000004',6,'liter')
on conflict do nothing;

insert into public.inventory_items (id, business_id, ingredient_id, sku, unit, stock, reserved, min_stock) values
  ('d0000000-0000-0000-0000-000000000021','11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000001','AYM-KPG','kg',20,0,25),
  ('d0000000-0000-0000-0000-000000000022','11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000002','BRS-PRM','kg',300,0,50),
  ('d0000000-0000-0000-0000-000000000023','11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000003','DGG-SPI','kg',60,0,20)
on conflict (id) do nothing;

insert into public.suppliers (id, business_id, name, phone, address) values
  ('d0000000-0000-0000-0000-000000000031','11111111-1111-1111-1111-111111111111','Pasar Wage — Los Daging Bu Tari','+6281230003333','Pasar Wage Nganjuk'),
  ('d0000000-0000-0000-0000-000000000032','11111111-1111-1111-1111-111111111111','Toko Beras Barokah','+6281230004444','Jl. Panglima Sudirman Nganjuk')
on conflict (id) do nothing;

insert into public.customers (id, business_id, name, phone, email, address, source, event_count, total_spent) values
  ('f0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Budi Santoso & Dewi Lestari','+6281234567001','budi.dewi@example.id','Kertosono, Nganjuk','Instagram',1,0),
  ('f0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','PT Maju Jaya Abadi','+6281234567002','ga@majujaya.example.id','Kawasan Industri Nganjuk','Referral',3,84000000),
  ('f0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Hj. Fatimah','+6281234567003',null,'Sukomoro, Nganjuk','WhatsApp',2,19200000),
  ('f0000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Agus Prasetyo','+6281234567004',null,'Bagor, Nganjuk','Google',0,0)
on conflict (id) do nothing;

-- EVENTS (7 demo scenarios)
insert into public.events (id, business_id, event_no, customer_id, title, event_type, event_date, start_at, venue_id, venue_text,
  pax_estimated, pax_quoted, pax_confirmed, pax_final, pax_locked, status, payment_status,
  vegetarian, vegan, allergies, dietary_notes, special_instructions) values
  -- 001 normal 500 pax wedding
  ('10000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','EVENT-2026-001','f0000000-0000-0000-0000-000000000001',
   'Pernikahan Budi & Dewi','Pernikahan','2026-09-20','2026-09-20T11:00:00+07','a0000000-0000-0000-0000-000000000001',null,
   500,500,500,500,true,'IN_PREPARATION','PARTIAL',15,5,array['udang'],'Alergi udang: 3 tamu VIP meja 2','Akad 08.00, resepsi 11.00–13.00'),
  -- 002 risk event: shortage + no vehicle + final payment pending
  ('10000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','EVENT-2026-002','f0000000-0000-0000-0000-000000000002',
   'Gathering PT Maju Jaya','Korporat','2026-09-12','2026-09-12T09:00:00+07',null,'Aula PT Maju Jaya',
   300,300,300,null,false,'PLANNING','PARTIAL',0,0,'{}',null,'Sound & MC dari kantor'),
  -- 003 change request 300 → 350
  ('10000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','EVENT-2026-003','f0000000-0000-0000-0000-000000000003',
   'Pengajian Akbar Hj. Fatimah','Pengajian','2026-09-25','2026-09-25T18:00:00+07','a0000000-0000-0000-0000-000000000002',null,
   300,300,350,350,true,'LOCKED','PARTIAL',40,0,'{}','Vegetarian 40 box terpisah',null),
  -- 004/005 resource conflict: same day, staff need 12 + 10 > 16 available
  ('10000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','EVENT-2026-004','f0000000-0000-0000-0000-000000000001',
   'Ngunduh Mantu (siang)','Pernikahan','2026-09-27','2026-09-27T11:00:00+07','a0000000-0000-0000-0000-000000000001',null,
   400,400,400,null,false,'PLANNING','PENDING',0,0,'{}',null,null),
  ('10000000-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','EVENT-2026-005','f0000000-0000-0000-0000-000000000002',
   'Outing Kantor (sore)','Korporat','2026-09-27','2026-09-27T15:00:00+07',null,'Taman Wisata Anjuk Ladang',
   250,250,250,null,false,'PLANNING','PENDING',0,0,'{}',null,null),
  -- 006 incident: equipment missing
  ('10000000-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','EVENT-2026-006','f0000000-0000-0000-0000-000000000004',
   'Khitanan Ananda Agus','Aqiqah','2026-09-05','2026-09-05T10:00:00+07',null,'Kediaman mempelai, Bagor',
   150,150,150,150,true,'COMPLETED','PAID',0,0,'{}',null,null),
  -- 007 completed full lifecycle
  ('10000000-0000-0000-0000-000000000007','11111111-1111-1111-1111-111111111111','EVENT-2026-007','f0000000-0000-0000-0000-000000000002',
   'Raker Semester PT Maju Jaya','Korporat','2026-08-15','2026-08-15T08:00:00+07',null,'Aula PT Maju Jaya',
   200,200,200,200,true,'CLOSED','PAID',0,0,'{}',null,null)
on conflict (id) do nothing;

insert into public.quotes (id, business_id, customer_id, quote_no, status, subtotal, discount, total) values
  ('20000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','f0000000-0000-0000-0000-000000000001','Q-2026-001','APPROVED',27500000,0,27500000),
  ('20000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','f0000000-0000-0000-0000-000000000003','Q-2026-003','APPROVED',11200000,0,11200000)
on conflict (id) do nothing;

-- Q-2026-003 V1 300 pax → V2 350 pax approved (change-request demo)
insert into public.quote_versions (id, quote_id, version, pax, items, subtotal, discount, total, change_summary, approved_at) values
  ('21000000-0000-0000-0000-000000000031','20000000-0000-0000-0000-000000000003',1,300,
   '[{"name":"Paket Pengajian Berkah","qty":1,"unit_price":32000,"per_pax":true}]',9600000,0,9600000,'Penawaran awal 300 pax',null),
  ('21000000-0000-0000-0000-000000000032','20000000-0000-0000-0000-000000000003',2,350,
   '[{"name":"Paket Pengajian Berkah","qty":1,"unit_price":32000,"per_pax":true}]',11200000,0,11200000,'Tambah 50 pax sesuai permintaan pelanggan','2026-09-02T10:00:00+07')
on conflict (id) do nothing;

insert into public.bookings (business_id, event_id, quote_id, status) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','CONFIRMED'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','CONFIRMED')
on conflict do nothing;

insert into public.payments (business_id, event_id, amount, method, kind, status, received_at, reference) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001',8250000,'TRANSFER','DP','PAID','2026-09-01T14:00:00+07','TRF-BCA-001'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000003',3360000,'QRIS','DP','PAID','2026-09-02T11:00:00+07','QRIS-003'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000007',5600000,'TRANSFER','FULL','PAID','2026-08-10T10:00:00+07','TRF-BCA-007')
on conflict do nothing;

insert into public.expenses (business_id, event_id, category, amount, note, spent_at) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','Bahan Baku',11000000,'Belanja dapur termin 1','2026-09-10'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','Tenaga Kerja',5000000,'Tim 14 orang','2026-09-10'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','Transport',2000000,'2 armada + solar','2026-09-10'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000007','Bahan Baku',2200000,'Raker 200 pax','2026-08-12'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000007','Tenaga Kerja',1200000,'Tim 8 orang','2026-08-12')
on conflict do nothing;

insert into public.production_plans (id, business_id, event_id, status, target_qty, scheduled_at) values
  ('30000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','PREPARING',500,'2026-09-19T04:00:00+07')
on conflict (id) do nothing;
insert into public.production_batches (plan_id, recipe_id, name, status, target_qty, actual_qty) values
  ((select '30000000-0000-0000-0000-000000000001'::uuid),'d0000000-0000-0000-0000-000000000011','Ayam Lodho — Batch 1','PREPARING',500,500)
on conflict do nothing;

insert into public.purchase_orders (id, business_id, supplier_id, event_id, status, total) values
  ('40000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','d0000000-0000-0000-0000-000000000031','10000000-0000-0000-0000-000000000001','SENT',975000)
on conflict (id) do nothing;
insert into public.purchase_order_items (po_id, ingredient_id, name, qty, unit, unit_price) values
  ('40000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000001','Ayam Kampung (kekurangan 15 kg)',15,'kg',65000)
on conflict do nothing;

insert into public.staff (id, business_id, name, role, phone) values
  ('50000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Slamet Riyadi','supervisor','+6281200000001'),
  ('50000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Wahyu Hidayat','operations','+6281200000002'),
  ('50000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Dapur — Bu Sri','kitchen','+6281200000003'),
  ('50000000-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Dedi Sopir','driver','+6281200000004')
on conflict (id) do nothing;

insert into public.staff_assignments (business_id, event_id, staff_id, role) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','supervisor'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003','kitchen'),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000004','driver')
on conflict do nothing;

insert into public.vehicles (id, business_id, name, plate, capacity_text, driver_name, status) values
  ('50000000-0000-0000-0000-000000000011','11111111-1111-1111-1111-111111111111','Grand Max Box','AE 8123 NN','800 kg catering box','Dedi Sopir','READY'),
  ('50000000-0000-0000-0000-000000000012','11111111-1111-1111-1111-111111111111','Engkel Long','AE 8456 NN','2 ton + rak prasmanan','Joko','READY')
on conflict (id) do nothing;
insert into public.vehicle_assignments (business_id, event_id, vehicle_id) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000011')
on conflict do nothing;

insert into public.equipment (id, business_id, name, total_qty, condition) values
  ('50000000-0000-0000-0000-000000000021','11111111-1111-1111-1111-111111111111','Chafing Dish',20,'BAIK'),
  ('50000000-0000-0000-0000-000000000022','11111111-1111-1111-1111-111111111111','Meja Prasmanan',10,'BAIK'),
  ('50000000-0000-0000-0000-000000000023','11111111-1111-1111-1111-111111111111','Set Sendok-Garpu',600,'BAIK')
on conflict (id) do nothing;
insert into public.equipment_assignments (business_id, event_id, equipment_id, qty, loaded_qty) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000021',10,10),
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000022',8,8)
on conflict do nothing;
-- incident demo: 2 chafing dish missing on return
insert into public.equipment_reconciliation (event_id, equipment_id, assigned, loaded, returned, damaged, note) values
  ('10000000-0000-0000-0000-000000000006','50000000-0000-0000-0000-000000000021',10,10,8,0,'2 unit belum kembali dari venue — follow up ke tuan rumah')
on conflict do nothing;

insert into public.incidents (business_id, event_id, incident_no, category, severity, title, description, status, financial_impact) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000006','INC-2026-001','Peralatan','HIGH',
   '2 chafing dish belum kembali','Rekonsiliasi pasca-acara khitanan: 10 dibawa, 8 kembali. Diduga tertinggal di dapur venue.','INVESTIGATING',600000)
on conflict do nothing;

insert into public.complaints (business_id, event_id, customer_name, category, message, status) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000006','Agus Prasetyo','Porsi',
   'Es dawet habis sebelum acara selesai, tamu kloter akhir tidak kebagian.','OPEN')
on conflict do nothing;

insert into public.change_requests (business_id, event_id, type, payload, impact, status) values
  ('11111111-1111-1111-1111-111111111111','10000000-0000-0000-0000-000000000003','PAX',
   '{"old_pax": 300, "new_pax": 350}',
   '{"price_delta": 1600000, "staffing_delta": 1, "vehicle_ok": true, "equipment_ok": true, "timeline_ok": true, "availability_ok": true, "profit_delta": 640000}',
   'APPLIED')
on conflict do nothing;

insert into public.event_timelines (event_id, label, planned_at, owner) values
  ('10000000-0000-0000-0000-000000000001','Dapur siap','2026-09-20T07:00:00+07','Bu Sri'),
  ('10000000-0000-0000-0000-000000000001','Keberangkatan','2026-09-20T07:30:00+07','Dedi'),
  ('10000000-0000-0000-0000-000000000001','Tiba di venue','2026-09-20T08:30:00+07','Slamet'),
  ('10000000-0000-0000-0000-000000000001','Setup','2026-09-20T09:00:00+07','Slamet'),
  ('10000000-0000-0000-0000-000000000001','Layanan prasmanan','2026-09-20T11:00:00+07','Wahyu')
on conflict do nothing;

insert into public.testimonials (business_id, customer_name, rating, message, event_type) values
  ('11111111-1111-1111-1111-111111111111','PT Maju Jaya Abadi',5,'Raker 200 orang rapi, on-time, makanan hangat sampai sesi terakhir.','Korporat'),
  ('11111111-1111-1111-1111-111111111111','Hj. Fatimah',5,'Pengajiannya khidmat, snack-nya disukai ibu-ibu.','Pengajian')
on conflict do nothing;

insert into public.promotions (business_id, code, kind, value, min_order, is_active) values
  ('11111111-1111-1111-1111-111111111111','HAJATAN10','PERCENT',10,5000000,true)
on conflict do nothing;

insert into public.website_content (business_id, key, value) values
  ('11111111-1111-1111-1111-111111111111','hero','{"title": "Prasmanan yang bikin hajatan tenang", "subtitle": "Dari akad sampai beres-beres — terpantau, terdokumentasi, tepat waktu.", "cta": "Minta Penawaran"}'),
  ('11111111-1111-1111-1111-111111111111','contact','{"whatsapp": "+6281234567890", "address": "Jl. A. Yani No. 88, Nganjuk"}')
on conflict do nothing;
