-- Catering OS · 0001_init · full schema + RLS + invariants
-- Postgres via Supabase. Every business-owned row carries business_id (tenant isolation).

-- ============ helpers (table-independent only; table-dependent helpers are defined after tables) ============
create or replace function public.touch_updated()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============ core ============
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null,
  currency text not null default 'IDR',
  created_at timestamptz not null default now()
);

create table public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  logo_url text, address text, phone text, whatsapp text, email text,
  operating_hours jsonb not null default '{}', tax_pct numeric not null default 0,
  payment_info jsonb not null default '{}', notification jsonb not null default '{}',
  branding jsonb not null default '{}', updated_at timestamptz not null default now()
);

create table public.business_capabilities (
  business_id uuid not null references public.businesses(id) on delete cascade,
  capability text not null, enabled boolean not null default true,
  primary key (business_id, capability)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  role text not null default 'staff'
    check (role in ('owner','admin','sales','finance','kitchen','operations','driver','staff','supervisor','customer')),
  full_name text not null default '', phone text,
  created_at timestamptz not null default now()
);

create table public.roles (name text primary key, description text);
create table public.permissions (name text primary key, description text);
create table public.role_permissions (
  role text not null references public.roles(name) on delete cascade,
  permission text not null references public.permissions(name) on delete cascade,
  primary key (role, permission)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null, role text not null default 'staff',
  phone text, available boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============ sales / CRM ============
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, phone text not null, source text,
  event_type text, estimated_pax int, estimated_date date,
  status text not null default 'NEW' check (status in ('NEW','CONTACTED','QUALIFIED','LOST','CONVERTED')),
  lost_reason text, created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, phone text not null, email text, address text,
  source text, notes text, total_spent bigint not null default 0,
  event_count int not null default 0, last_event_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null default 'Rumah', address text not null, maps_url text
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  contact_name text not null default '', contact_phone text not null default '',
  event_type text not null, event_date date not null, venue_text text,
  venue_id uuid, pax int not null check (pax > 0),
  menu_notes text, dietary_notes text, vegetarian int not null default 0,
  vegan int not null default 0, allergies text[] not null default '{}',
  status text not null default 'NEW'
    check (status in ('NEW','CONTACTED','QUOTED','BOOKED','CLOSED','DROPPED')),
  created_at timestamptz not null default now()
);

-- ============ catalog ============
create table public.event_types (id uuid primary key default gen_random_uuid(), business_id uuid references public.businesses(id) on delete cascade, name text not null, description text);
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, address text not null default '', maps_url text,
  contact_name text, contact_phone text, access_notes text, parking_notes text,
  power_notes text, restrictions text, setup_notes text, photo_urls text[] not null default '{}'
);
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, category text not null default 'Utama',
  description text, image_url text, is_active boolean not null default true
);
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, description text, base_price_per_pax bigint not null check (base_price_per_pax >= 0),
  min_pax int not null default 50, max_pax int, image_url text, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null, qty_per_pax numeric not null default 1, unit text not null default 'porsi'
);
create table public.package_addons (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  name text not null, price bigint not null default 0, per_pax boolean not null default true
);
create table public.dietary_tags (code text primary key, label text not null);
create table public.allergens (code text primary key, label text not null);

create table public.price_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, rule jsonb not null default '{}', is_active boolean not null default true
);
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  code text not null, kind text not null check (kind in ('PERCENT','FIXED')),
  value bigint not null, min_order bigint not null default 0,
  starts_at timestamptz, ends_at timestamptz, usage_limit int, used_count int not null default 0,
  is_active boolean not null default true,
  unique (business_id, code)
);
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  code text not null, promotion_id uuid references public.promotions(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  redeemed_at timestamptz, unique (business_id, code)
);

-- ============ quotation ============
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quote_no text not null, status text not null default 'DRAFT'
    check (status in ('DRAFT','SENT','VIEWED','REVISION_REQUESTED','APPROVED','REJECTED','EXPIRED')),
  subtotal bigint not null default 0, discount bigint not null default 0, total bigint not null default 0,
  valid_until date, created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (business_id, quote_no)
);
create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  version int not null, pax int not null check (pax > 0),
  items jsonb not null default '[]', subtotal bigint not null default 0,
  discount bigint not null default 0, total bigint not null default 0,
  change_summary text, created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz, approved_by uuid references public.profiles(id),
  unique (quote_id, version)
);
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.quote_versions(id) on delete cascade,
  name text not null, qty numeric not null default 1, unit_price bigint not null default 0,
  per_pax boolean not null default true
);
create table public.quote_approvals (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  version_id uuid not null references public.quote_versions(id) on delete cascade,
  approver_name text not null default '', approved_at timestamptz not null default now(),
  channel text not null default 'web'
);

-- ============ booking & event ============
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid, quote_id uuid references public.quotes(id) on delete set null,
  status text not null default 'TENTATIVE' check (status in ('TENTATIVE','CONFIRMED','CANCELLED','COMPLETED')),
  booked_at timestamptz not null default now()
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_no text not null, customer_id uuid references public.customers(id) on delete set null,
  title text not null default '', event_type text not null default 'Pernikahan',
  event_date date not null, start_at timestamptz, end_at timestamptz, setup_at timestamptz,
  venue_id uuid references public.venues(id) on delete set null, venue_text text,
  pax_estimated int not null default 0, pax_quoted int not null default 0,
  pax_confirmed int not null default 0, pax_final int, pax_locked boolean not null default false,
  status text not null default 'PLANNING'
    check (status in ('PLANNING','LOCKED','IN_PREPARATION','IN_TRANSIT','SETUP','SERVICE','BREAKDOWN','COMPLETED','CLOSED')),
  payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING','PARTIAL','PAID','FAILED','REFUNDED')),
  approved_quote_version_id uuid references public.quote_versions(id) on delete set null,
  service_style text, vegetarian int not null default 0, vegan int not null default 0,
  allergies text[] not null default '{}', dietary_notes text, dietary_ack_by uuid references public.profiles(id),
  special_instructions text, created_at timestamptz not null default now(),
  unique (business_id, event_no)
);
create table public.event_timelines (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null, planned_at timestamptz not null, done_at timestamptz, owner text
);
create table public.event_briefs (
  event_id uuid primary key references public.events(id) on delete cascade,
  snapshot jsonb not null default '{}', generated_at timestamptz not null default now()
);
create table public.pax_revisions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  old_pax int, new_pax int not null, reason text, created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.event_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null, qty numeric not null, unit text not null default 'porsi',
  category text not null default 'FOOD', required_qty numeric, packed_qty numeric not null default 0
);
create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  type text not null check (type in ('PAX','MENU','DATE','VENUE','ADDON','EQUIPMENT','DECOR','DURATION')),
  payload jsonb not null default '{}', impact jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','QUOTED','APPROVED','REJECTED','APPLIED')),
  created_at timestamptz not null default now()
);

-- ============ production / inventory / procurement ============
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, unit text not null default 'kg', sku text
);
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null, yield_qty numeric not null default 1, yield_unit text not null default 'porsi'
);
create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  qty_per_yield numeric not null, unit text not null
);
create table public.production_plans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  status text not null default 'PLANNED' check (status in ('PLANNED','PREPARING','PRODUCING','QC','COMPLETED')),
  target_qty int not null, actual_qty int, scheduled_at timestamptz
);
create table public.production_batches (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.production_plans(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  name text not null, status text not null default 'PLANNED'
    check (status in ('PLANNED','PREPARING','PRODUCING','QC','COMPLETED')),
  target_qty int not null, actual_qty int, waste_qty numeric not null default 0
);
create table public.quality_checks (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.production_batches(id) on delete cascade,
  passed boolean not null, note text, photo_url text, checked_by uuid references public.profiles(id),
  checked_at timestamptz not null default now()
);
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  sku text not null default '', unit text not null default 'kg',
  stock numeric not null default 0, reserved numeric not null default 0,
  min_stock numeric not null default 0, expires_at date, location text,
  unique (business_id, ingredient_id)
);
create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  kind text not null check (kind in ('PURCHASE','RECEIVING','RESERVATION','CONSUMPTION','ADJUSTMENT','WASTE','RETURN')),
  qty numeric not null, ref_type text, ref_id uuid, note text,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, phone text, address text, status text not null default 'ACTIVE'
);
create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT','SENT','RECEIVED','CANCELLED')),
  total bigint not null default 0, created_at timestamptz not null default now()
);
create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references public.purchase_orders(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  name text not null, qty numeric not null, unit text not null, unit_price bigint not null default 0
);
create table public.receiving_records (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references public.purchase_orders(id) on delete cascade,
  received_qty numeric not null, note text, photo_url text,
  received_by uuid references public.profiles(id), received_at timestamptz not null default now()
);

-- ============ workforce / fleet / equipment / tasks ============
create table public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  role text not null default 'staff', unique (event_id, staff_id)
);
create table public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.staff_assignments(id) on delete cascade,
  present boolean not null, checked_at timestamptz not null default now(), note text
);
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, plate text, capacity_text text, driver_name text, status text not null default 'READY'
);
create table public.vehicle_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade
);
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, total_qty int not null default 0, condition text not null default 'BAIK'
);
create table public.equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  qty int not null, loaded_qty int not null default 0
);
create table public.equipment_reconciliation (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  assigned int not null, loaded int not null, returned int not null,
  missing int generated always as (assigned - returned) stored,
  damaged int not null default 0, note text, reconciled_at timestamptz not null default now()
);
create table public.transport_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null default 'DELIVERY', status text not null default 'PENDING',
  departed_at timestamptz, eta_at timestamptz, arrived_at timestamptz,
  receiver_name text, photo_url text, note text
);
create table public.setup_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null, done boolean not null default false, photo_url text, done_at timestamptz
);
create table public.service_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null, done boolean not null default false, done_at timestamptz
);
create table public.breakdown_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null, done boolean not null default false, done_at timestamptz
);

-- ============ finance ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  amount bigint not null check (amount > 0), method text not null default 'TRANSFER',
  kind text not null default 'DP' check (kind in ('DP','FINAL','FULL','REFUND','OTHER')),
  status text not null default 'PENDING' check (status in ('PENDING','PARTIAL','PAID','FAILED','REFUNDED')),
  received_at timestamptz, reference text, created_at timestamptz not null default now()
);
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  kind text not null, amount bigint not null, meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  category text not null, amount bigint not null check (amount >= 0),
  note text, spent_at date not null default current_date
);
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  amount bigint not null check (amount > 0), reason text, status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

-- ============ CX / incidents ============
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  customer_name text not null default '', category text not null default 'Layanan',
  message text not null, status text not null default 'OPEN', created_at timestamptz not null default now()
);
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  incident_no text not null, category text not null, severity text not null default 'MEDIUM'
    check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  title text not null, description text not null,
  status text not null default 'OPEN'
    check (status in ('OPEN','INVESTIGATING','ACTION_REQUIRED','RESOLVED','CLOSED')),
  owner_id uuid references public.profiles(id), financial_impact bigint not null default 0,
  resolution_note text, created_at timestamptz not null default now(), resolved_at timestamptz
);
create table public.incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  photo_url text not null, caption text, created_at timestamptz not null default now()
);
create table public.compensations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  incident_id uuid references public.incidents(id) on delete set null,
  kind text not null, amount bigint not null default 0, note text,
  created_at timestamptz not null default now()
);

-- ============ engagement / content ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null, title text not null, body text not null default '',
  event_id uuid references public.events(id) on delete set null,
  read_at timestamptz, created_at timestamptz not null default now()
);
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  prefs jsonb not null default '{}'
);
create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  image_url text not null, caption text, sort int not null default 0
);
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text not null, rating int not null check (rating between 1 and 5),
  message text not null, event_type text, is_published boolean not null default true
);
create table public.website_content (
  business_id uuid not null references public.businesses(id) on delete cascade,
  key text not null, value jsonb not null default '{}',
  primary key (business_id, key)
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null, entity text not null, entity_id uuid,
  before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);

alter table public.bookings
  add constraint bookings_event_fk foreign key (event_id) references public.events(id) on delete cascade;

-- ============ membership helpers (need profiles/events to exist) ============
create or replace function public.uid_business_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select business_id from public.profiles where id = auth.uid() and business_id is not null
$$;

create or replace function public.is_member(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and business_id = b)
$$;

create or replace function public.is_event_member(e uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.events ev
    join public.profiles p on p.business_id = ev.business_id
    where ev.id = e and p.id = auth.uid()
  )
$$;

-- ============ state-transition guard (events) ============
create or replace function public.assert_event_transition()
returns trigger language plpgsql as $$
declare allowed text[];
begin
  if old.status = new.status then return new; end if;
  allowed := case old.status
    when 'PLANNING' then array['LOCKED','IN_PREPARATION']
    when 'LOCKED' then array['IN_PREPARATION']
    when 'IN_PREPARATION' then array['IN_TRANSIT']
    when 'IN_TRANSIT' then array['SETUP']
    when 'SETUP' then array['SERVICE']
    when 'SERVICE' then array['BREAKDOWN']
    when 'BREAKDOWN' then array['COMPLETED']
    when 'COMPLETED' then array['CLOSED']
    else array[]::text[] end;
  if not (new.status = any (allowed)) then
    raise exception 'Invalid event transition % → %', old.status, new.status;
  end if;
  return new;
end $$;
drop trigger if exists trg_event_transition on public.events;
create trigger trg_event_transition before update of status on public.events
  for each row execute function public.assert_event_transition();

-- approved quote versions are immutable
create or replace function public.lock_approved_quote_version()
returns trigger language plpgsql as $$
begin
  if old.approved_at is not null then
    raise exception 'Approved quote version is locked';
  end if;
  return new;
end $$;
drop trigger if exists trg_lock_quote_version on public.quote_versions;
create trigger trg_lock_quote_version before update on public.quote_versions
  for each row execute function public.lock_approved_quote_version();

-- audit writer for sensitive tables
create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare b uuid;
begin
  b := coalesce((to_jsonb(new)->>'business_id')::uuid, (to_jsonb(old)->>'business_id')::uuid, null);
  insert into public.audit_logs (business_id, actor_id, action, entity, entity_id, before_data, after_data)
  values (b, auth.uid(), TG_OP, TG_TABLE_NAME,
    coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid),
    to_jsonb(old), to_jsonb(new));
  return coalesce(new, old);
end $$;

-- ============ RLS ============
alter table public.businesses enable row level security;
alter table public.business_settings enable row level security;
alter table public.business_capabilities enable row level security;
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.leads enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.inquiries enable row level security;
alter table public.event_types enable row level security;
alter table public.venues enable row level security;
alter table public.menu_items enable row level security;
alter table public.packages enable row level security;
alter table public.package_items enable row level security;
alter table public.package_addons enable row level security;
alter table public.price_rules enable row level security;
alter table public.promotions enable row level security;
alter table public.coupons enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_versions enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_approvals enable row level security;
alter table public.bookings enable row level security;
alter table public.events enable row level security;
alter table public.event_timelines enable row level security;
alter table public.event_briefs enable row level security;
alter table public.pax_revisions enable row level security;
alter table public.event_items enable row level security;
alter table public.change_requests enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.production_plans enable row level security;
alter table public.production_batches enable row level security;
alter table public.quality_checks enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.receiving_records enable row level security;
alter table public.staff_assignments enable row level security;
alter table public.staff_attendance enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_assignments enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_assignments enable row level security;
alter table public.equipment_reconciliation enable row level security;
alter table public.transport_tasks enable row level security;
alter table public.setup_tasks enable row level security;
alter table public.service_tasks enable row level security;
alter table public.breakdown_tasks enable row level security;
alter table public.payments enable row level security;
alter table public.transactions enable row level security;
alter table public.expenses enable row level security;
alter table public.refunds enable row level security;
alter table public.complaints enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_evidence enable row level security;
alter table public.compensations enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.galleries enable row level security;
alter table public.testimonials enable row level security;
alter table public.website_content enable row level security;
alter table public.audit_logs enable row level security;

-- member full access on business-owned tables (server re-checks capability per action in Edge Functions)
do $$
declare t text;
begin
  foreach t in array array[
    'business_settings','business_capabilities','staff','leads','customers','customer_addresses',
    'inquiries','event_types','venues','menu_items','packages',
    'price_rules','promotions','coupons','quotes',
    'bookings','events','pax_revisions','change_requests',
    'ingredients','recipes','production_plans',
    'inventory_items','inventory_transactions','suppliers','purchase_orders',
    'staff_assignments','vehicles','vehicle_assignments',
    'equipment','equipment_assignments','transport_tasks',
    'payments','transactions','expenses','refunds',
    'complaints','incidents','compensations','notifications','galleries',
    'testimonials','website_content','audit_logs'
  ] loop
    execute format('drop policy if exists member_all on public.%I', t);
    execute format(
      'create policy member_all on public.%I for all to authenticated using (public.is_member(business_id)) with check (public.is_member(business_id))',
      t);
  end loop;
end $$;

-- child tables without business_id: gate via parent membership
drop policy if exists member_all on public.package_items;
create policy member_all on public.package_items for all to authenticated
  using (exists (select 1 from public.packages p join public.profiles pr on pr.business_id = p.business_id where p.id = package_items.package_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.packages p join public.profiles pr on pr.business_id = p.business_id where p.id = package_items.package_id and pr.id = auth.uid()));
drop policy if exists member_all on public.package_addons;
create policy member_all on public.package_addons for all to authenticated
  using (exists (select 1 from public.packages p join public.profiles pr on pr.business_id = p.business_id where p.id = package_addons.package_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.packages p join public.profiles pr on pr.business_id = p.business_id where p.id = package_addons.package_id and pr.id = auth.uid()));
drop policy if exists member_all on public.quote_items;
create policy member_all on public.quote_items for all to authenticated
  using (exists (select 1 from public.quote_versions v join public.quotes q on q.id = v.quote_id join public.profiles pr on pr.business_id = q.business_id where v.id = quote_items.version_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.quote_versions v join public.quotes q on q.id = v.quote_id join public.profiles pr on pr.business_id = q.business_id where v.id = quote_items.version_id and pr.id = auth.uid()));
drop policy if exists member_all on public.quote_versions;
create policy member_all on public.quote_versions for all to authenticated
  using (exists (select 1 from public.quotes q join public.profiles pr on pr.business_id = q.business_id where q.id = quote_versions.quote_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.quotes q join public.profiles pr on pr.business_id = q.business_id where q.id = quote_versions.quote_id and pr.id = auth.uid()));
drop policy if exists member_all on public.quote_approvals;
create policy member_all on public.quote_approvals for all to authenticated
  using (exists (select 1 from public.quotes q join public.profiles pr on pr.business_id = q.business_id where q.id = quote_approvals.quote_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.quotes q join public.profiles pr on pr.business_id = q.business_id where q.id = quote_approvals.quote_id and pr.id = auth.uid()));
drop policy if exists member_all on public.event_timelines;
create policy member_all on public.event_timelines for all to authenticated
  using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
drop policy if exists member_all on public.event_briefs;
create policy member_all on public.event_briefs for all to authenticated
  using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
drop policy if exists member_all on public.event_items;
create policy member_all on public.event_items for all to authenticated
  using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
drop policy if exists member_all on public.setup_tasks;
create policy member_all on public.setup_tasks for all to authenticated
  using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
drop policy if exists member_all on public.service_tasks;
create policy member_all on public.service_tasks for all to authenticated
  using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
drop policy if exists member_all on public.breakdown_tasks;
create policy member_all on public.breakdown_tasks for all to authenticated
  using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
drop policy if exists member_all on public.equipment_reconciliation;
create policy member_all on public.equipment_reconciliation for all to authenticated
  using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
drop policy if exists member_all on public.production_batches;
create policy member_all on public.production_batches for all to authenticated
  using (exists (select 1 from public.production_plans pl join public.profiles pr on pr.business_id = pl.business_id where pl.id = production_batches.plan_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.production_plans pl join public.profiles pr on pr.business_id = pl.business_id where pl.id = production_batches.plan_id and pr.id = auth.uid()));
drop policy if exists member_all on public.recipe_items;
create policy member_all on public.recipe_items for all to authenticated
  using (exists (select 1 from public.recipes r join public.profiles pr on pr.business_id = r.business_id where r.id = recipe_items.recipe_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.recipes r join public.profiles pr on pr.business_id = r.business_id where r.id = recipe_items.recipe_id and pr.id = auth.uid()));
drop policy if exists member_all on public.quality_checks;
create policy member_all on public.quality_checks for all to authenticated
  using (exists (select 1 from public.production_batches b join public.production_plans pl on pl.id = b.plan_id join public.profiles pr on pr.business_id = pl.business_id where b.id = quality_checks.batch_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.production_batches b join public.production_plans pl on pl.id = b.plan_id join public.profiles pr on pr.business_id = pl.business_id where b.id = quality_checks.batch_id and pr.id = auth.uid()));
drop policy if exists member_all on public.purchase_order_items;
create policy member_all on public.purchase_order_items for all to authenticated
  using (exists (select 1 from public.purchase_orders po join public.profiles pr on pr.business_id = po.business_id where po.id = purchase_order_items.po_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.purchase_orders po join public.profiles pr on pr.business_id = po.business_id where po.id = purchase_order_items.po_id and pr.id = auth.uid()));
drop policy if exists member_all on public.receiving_records;
create policy member_all on public.receiving_records for all to authenticated
  using (exists (select 1 from public.purchase_orders po join public.profiles pr on pr.business_id = po.business_id where po.id = receiving_records.po_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.purchase_orders po join public.profiles pr on pr.business_id = po.business_id where po.id = receiving_records.po_id and pr.id = auth.uid()));
drop policy if exists member_all on public.staff_attendance;
create policy member_all on public.staff_attendance for all to authenticated
  using (exists (select 1 from public.staff_assignments sa join public.profiles pr on pr.business_id = sa.business_id where sa.id = staff_attendance.assignment_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.staff_assignments sa join public.profiles pr on pr.business_id = sa.business_id where sa.id = staff_attendance.assignment_id and pr.id = auth.uid()));
drop policy if exists member_all on public.incident_evidence;
create policy member_all on public.incident_evidence for all to authenticated
  using (exists (select 1 from public.incidents i join public.profiles pr on pr.business_id = i.business_id where i.id = incident_evidence.incident_id and pr.id = auth.uid()))
  with check (exists (select 1 from public.incidents i join public.profiles pr on pr.business_id = i.business_id where i.id = incident_evidence.incident_id and pr.id = auth.uid()));
drop policy if exists member_all on public.notification_preferences;
create policy member_all on public.notification_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- profiles: user reads own row + same-business rows
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select to authenticated
  using (id = auth.uid() or business_id in (select public.uid_business_ids()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- businesses: members read own
drop policy if exists businesses_member on public.businesses;
create policy businesses_member on public.businesses for select to authenticated
  using (id in (select public.uid_business_ids()));

-- public catalog reads (anon) for customer acquisition
do $$
declare t text;
begin
  foreach t in array array['packages','menu_items','galleries','testimonials','website_content'] loop
    execute format('drop policy if exists public_read on public.%I', t);
    execute format('create policy public_read on public.%I for select to anon using (true)', t);
  end loop;
end $$;

-- anon can open an inquiry (customer acquisition); business_id required
drop policy if exists inquiries_anon_insert on public.inquiries;
create policy inquiries_anon_insert on public.inquiries for insert to anon with check (true);
drop policy if exists complaints_anon_insert on public.complaints;
create policy complaints_anon_insert on public.complaints for insert to anon with check (true);

-- storage buckets
insert into storage.buckets (id, name, public) values
  ('gallery','gallery', true),
  ('menu','menu', true),
  ('evidence','evidence', false),
  ('documents','documents', false)
on conflict (id) do nothing;

drop policy if exists gallery_public on storage.objects;
create policy gallery_public on storage.objects for select to anon using (bucket_id in ('gallery','menu'));
drop policy if exists authed_upload on storage.objects;
create policy authed_upload on storage.objects for insert to authenticated with check (bucket_id in ('gallery','menu','evidence','documents'));
drop policy if exists authed_read_private on storage.objects;
create policy authed_read_private on storage.objects for select to authenticated using (bucket_id in ('gallery','menu','evidence','documents'));

-- audit triggers (sensitive actions)
drop trigger if exists audit_quotes on public.quotes;
create trigger audit_quotes after insert or update or delete on public.quotes
  for each row execute function public.write_audit();
drop trigger if exists audit_payments on public.payments;
create trigger audit_payments after insert or update or delete on public.payments
  for each row execute function public.write_audit();
drop trigger if exists audit_refunds on public.refunds;
create trigger audit_refunds after insert or update or delete on public.refunds
  for each row execute function public.write_audit();
drop trigger if exists audit_events on public.events;
create trigger audit_events after update on public.events
  for each row execute function public.write_audit();
drop trigger if exists audit_inventory on public.inventory_transactions;
create trigger audit_inventory after insert on public.inventory_transactions
  for each row execute function public.write_audit();
drop trigger if exists audit_incidents on public.incidents;
create trigger audit_incidents after insert or update on public.incidents
  for each row execute function public.write_audit();

-- seed static roles/permissions
insert into public.roles (name, description) values
  ('owner','Pemilik usaha'),('admin','Administrator'),('sales','Penjualan'),
  ('finance','Keuangan'),('kitchen','Dapur'),('operations','Operasional'),
  ('driver','Sopir'),('staff','Staf'),('supervisor','Supervisor'),('customer','Pelanggan')
on conflict (name) do nothing;
