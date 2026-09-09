-- Catering OS · 0004_customer_ops_read
-- Portal pelanggan: baca read-only operasional milik event sendiri (tanpa biaya/marjin).

drop policy if exists timelines_customer_select on public.event_timelines;
create policy timelines_customer_select on public.event_timelines
  for select to authenticated
  using (exists (
    select 1 from public.events e join public.customers c on c.id = e.customer_id
    where e.id = event_timelines.event_id and c.auth_user_id = auth.uid()
  ));

drop policy if exists items_customer_select on public.event_items;
create policy items_customer_select on public.event_items
  for select to authenticated
  using (exists (
    select 1 from public.events e join public.customers c on c.id = e.customer_id
    where e.id = event_items.event_id and c.auth_user_id = auth.uid()
  ));

drop policy if exists plans_customer_select on public.production_plans;
create policy plans_customer_select on public.production_plans
  for select to authenticated
  using (exists (
    select 1 from public.events e join public.customers c on c.id = e.customer_id
    where e.id = production_plans.event_id and c.auth_user_id = auth.uid()
  ));

drop policy if exists batches_customer_select on public.production_batches;
create policy batches_customer_select on public.production_batches
  for select to authenticated
  using (exists (
    select 1 from public.production_plans pl
    join public.events e on e.id = pl.event_id
    join public.customers c on c.id = e.customer_id
    where pl.id = production_batches.plan_id and c.auth_user_id = auth.uid()
  ));

drop policy if exists transport_customer_select on public.transport_tasks;
create policy transport_customer_select on public.transport_tasks
  for select to authenticated
  using (exists (
    select 1 from public.events e join public.customers c on c.id = e.customer_id
    where e.id = transport_tasks.event_id and c.auth_user_id = auth.uid()
  ));

drop policy if exists bookings_customer_select on public.bookings;
create policy bookings_customer_select on public.bookings
  for select to authenticated
  using (exists (
    select 1 from public.events e join public.customers c on c.id = e.customer_id
    where e.id = bookings.event_id and c.auth_user_id = auth.uid()
  ));
