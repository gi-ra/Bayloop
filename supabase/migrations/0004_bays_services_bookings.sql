-- Phase 2: bays, services (fixed-price menu), bookings
-- Plus: a hard database-level guarantee against double-booking a bay,
-- and two narrow public-facing functions for the booking flow.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.bays (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  name text not null,
  description text,
  price_min numeric,
  price_max numeric,
  estimated_minutes int not null default 60,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  customer_id uuid not null references public.customers (id),
  vehicle_id uuid not null references public.vehicles (id),
  service_id uuid references public.services (id),
  bay_id uuid references public.bays (id),
  drop_off_at timestamptz not null,
  pickup_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

-- Hard guarantee: the same bay can never have two overlapping,
-- non-cancelled bookings. This is enforced by Postgres itself, so it
-- holds even if two bookings are created at the exact same instant.
alter table public.bookings
  add constraint bookings_no_double_booking
  exclude using gist (
    bay_id with =,
    tstzrange(drop_off_at, pickup_at) with &&
  ) where (status <> 'cancelled' and bay_id is not null);

-- ---------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------

alter table public.bays enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;

-- bays: staff-only (the public site never needs to see bay names directly —
-- availability is handled through the function below instead)
create policy "staff_all_bays" on public.bays
  for all using (
    public.is_staff() and workshop_id = public.current_workshop_id()
  )
  with check (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );

-- services: anyone can read the public menu; only staff can edit it
create policy "anyone_read_services" on public.services
  for select using (true);

create policy "staff_write_services" on public.services
  for insert with check (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );
create policy "staff_update_services" on public.services
  for update using (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );
create policy "staff_delete_services" on public.services
  for delete using (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );

-- bookings: staff can see/manage every booking in their workshop
create policy "staff_all_bookings" on public.bookings
  for all using (
    public.is_staff() and workshop_id = public.current_workshop_id()
  )
  with check (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );

-- bookings: a customer can see only their own bookings
create policy "customer_read_own_bookings" on public.bookings
  for select using (
    public.current_role() = 'customer'
    and customer_id in (
      select id from public.customers where profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Public availability check
--
-- Tells the public booking page whether a given time slot has a free
-- bay, without exposing any booking or customer data. Safe for anyone
-- to call.
-- ---------------------------------------------------------------------

create or replace function public.has_available_bay(
  p_workshop_id uuid,
  p_drop_off_at timestamptz,
  p_pickup_at timestamptz
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.bays b
    where b.workshop_id = p_workshop_id
      and not exists (
        select 1 from public.bookings bk
        where bk.bay_id = b.id
          and bk.status <> 'cancelled'
          and tstzrange(bk.drop_off_at, bk.pickup_at) && tstzrange(p_drop_off_at, p_pickup_at)
      )
  );
$$;

grant execute on function public.has_available_bay(uuid, timestamptz, timestamptz) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Public booking creation
--
-- The only way the public site can create a booking. Finds or creates
-- the matching customer (by phone) and vehicle (by rego), picks a free
-- bay automatically, and inserts the booking — all as one safe,
-- narrow operation. Returns just the new booking's id.
-- ---------------------------------------------------------------------

create or replace function public.create_public_booking(
  p_workshop_id uuid,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_rego text,
  p_make text,
  p_model text,
  p_service_id uuid,
  p_drop_off_at timestamptz,
  p_pickup_at timestamptz,
  p_notes text
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_customer_id uuid;
  v_vehicle_id uuid;
  v_bay_id uuid;
  v_booking_id uuid;
begin
  select id into v_customer_id
  from public.customers
  where workshop_id = p_workshop_id and phone = p_phone
  limit 1;

  if v_customer_id is null then
    insert into public.customers (workshop_id, first_name, last_name, phone, email)
    values (p_workshop_id, p_first_name, p_last_name, p_phone, p_email)
    returning id into v_customer_id;
  end if;

  select id into v_vehicle_id
  from public.vehicles
  where customer_id = v_customer_id and rego = p_rego
  limit 1;

  if v_vehicle_id is null then
    insert into public.vehicles (workshop_id, customer_id, rego, make, model)
    values (p_workshop_id, v_customer_id, p_rego, p_make, p_model)
    returning id into v_vehicle_id;
  end if;

  select b.id into v_bay_id
  from public.bays b
  where b.workshop_id = p_workshop_id
    and not exists (
      select 1 from public.bookings bk
      where bk.bay_id = b.id
        and bk.status <> 'cancelled'
        and tstzrange(bk.drop_off_at, bk.pickup_at) && tstzrange(p_drop_off_at, p_pickup_at)
    )
  limit 1;

  if v_bay_id is null then
    raise exception 'No bay available for that time slot';
  end if;

  insert into public.bookings (
    workshop_id, customer_id, vehicle_id, service_id, bay_id,
    drop_off_at, pickup_at, status, notes
  )
  values (
    p_workshop_id, v_customer_id, v_vehicle_id, p_service_id, v_bay_id,
    p_drop_off_at, p_pickup_at, 'requested', p_notes
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

grant execute on function public.create_public_booking(
  uuid, text, text, text, text, text, text, text, uuid, timestamptz, timestamptz, text
) to anon, authenticated;
