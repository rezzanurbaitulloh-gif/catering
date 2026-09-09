-- Catering OS · 0003_customer_portal
-- Identitas customer via Supabase Auth (customers.auth_user_id) + akses mandiri.

alter table public.customers
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists customers_auth_user_id_uidx
  on public.customers (auth_user_id) where auth_user_id is not null;

-- customers: baca/tulis milik sendiri
drop policy if exists customers_customer_self on public.customers;
create policy customers_customer_self on public.customers
  for all to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- alamat: milik customer sendiri
drop policy if exists addresses_customer_self on public.customer_addresses;
create policy addresses_customer_self on public.customer_addresses
  for all to authenticated
  using (exists (select 1 from public.customers c where c.id = customer_addresses.customer_id and c.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.customers c where c.id = customer_addresses.customer_id and c.auth_user_id = auth.uid()));

-- inquiries: customer login boleh insert; baca hanya milik sendiri (klaim via checkout)
drop policy if exists inquiries_customer_insert on public.inquiries;
create policy inquiries_customer_insert on public.inquiries
  for insert to authenticated with check (true);
drop policy if exists inquiries_customer_select on public.inquiries;
create policy inquiries_customer_select on public.inquiries
  for select to authenticated
  using (exists (select 1 from public.customers c where c.id = inquiries.customer_id and c.auth_user_id = auth.uid()));

-- quotes: baca milik sendiri
drop policy if exists quotes_customer_select on public.quotes;
create policy quotes_customer_select on public.quotes
  for select to authenticated
  using (exists (select 1 from public.customers c where c.id = quotes.customer_id and c.auth_user_id = auth.uid()));

-- events: baca milik sendiri (portal + invoice + tracking langsung)
drop policy if exists events_customer_select on public.events;
create policy events_customer_select on public.events
  for select to authenticated
  using (exists (select 1 from public.customers c where c.id = events.customer_id and c.auth_user_id = auth.uid()));

-- payments: baca milik sendiri
drop policy if exists payments_customer_select on public.payments;
create policy payments_customer_select on public.payments
  for select to authenticated
  using (exists (
    select 1 from public.events e join public.customers c on c.id = e.customer_id
    where e.id = payments.event_id and c.auth_user_id = auth.uid()
  ));

-- change_requests: customer boleh ajukan + lihat milik eventnya
drop policy if exists cr_customer_all on public.change_requests;
create policy cr_customer_all on public.change_requests
  for all to authenticated
  using (exists (
    select 1 from public.events e join public.customers c on c.id = e.customer_id
    where e.id = change_requests.event_id and c.auth_user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e join public.customers c on c.id = e.customer_id
    where e.id = change_requests.event_id and c.auth_user_id = auth.uid()
  ));

-- complaints: customer boleh lapor (event miliknya bila diisi) + lihat miliknya
drop policy if exists complaints_customer_insert on public.complaints;
create policy complaints_customer_insert on public.complaints
  for insert to authenticated with check (true);
drop policy if exists complaints_customer_select on public.complaints;
create policy complaints_customer_select on public.complaints
  for select to authenticated
  using (
    complaints.event_id is null
    or exists (
      select 1 from public.events e join public.customers c on c.id = e.customer_id
      where e.id = complaints.event_id and c.auth_user_id = auth.uid()
    )
  );

-- notifications: customer lihat notif event miliknya (selain user_id staf)
drop policy if exists notifications_customer_select on public.notifications;
create policy notifications_customer_select on public.notifications
  for select to authenticated
  using (
    notifications.user_id = auth.uid()
    or exists (
      select 1 from public.events e join public.customers c on c.id = e.customer_id
      where e.id = notifications.event_id and c.auth_user_id = auth.uid()
    )
  );
