-- Phase 1: foundations
-- Tables: workshops, profiles, customers, vehicles
-- Plus: helper functions, row-level security (RLS) policies, and a
-- trigger that creates a profile automatically whenever someone signs up.

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abn text,
  phone text,
  email text,
  address text,
  timezone text not null default 'Australia/Sydney',
  created_at timestamptz not null default now()
);

-- One row per login. id matches auth.users.id exactly (1:1).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  workshop_id uuid references public.workshops (id),
  role text not null check (role in ('customer', 'technician', 'admin', 'owner')),
  first_name text,
  last_name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The customer/business record. Can exist before the customer ever logs in
-- (e.g. admin creates it when booking them in over the phone).
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  profile_id uuid references public.profiles (id),
  business_name text,
  first_name text,
  last_name text,
  phone text,
  email text,
  marketing_consent boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  customer_id uuid not null references public.customers (id),
  rego text,
  vin text,
  make text,
  model text,
  year int,
  engine text,
  odometer int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Helper functions
--
-- These read the current logged-in user's own profile row. They're
-- marked `security definer` so they can read `profiles` even though
-- profiles itself has row-level security turned on below — without
-- this, checking "what's my role?" would be blocked by the very rule
-- that needs the answer.
-- ---------------------------------------------------------------------

create or replace function public.current_workshop_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select workshop_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('technician', 'admin', 'owner')
  );
$$;

-- ---------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------

alter table public.workshops enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;

-- workshops: staff can read their own workshop's settings
create policy "staff_read_own_workshop" on public.workshops
  for select using (id = public.current_workshop_id());

-- profiles: everyone can read + update their own profile row
create policy "read_own_profile" on public.profiles
  for select using (id = auth.uid());

create policy "update_own_profile" on public.profiles
  for update using (id = auth.uid());

-- profiles: staff can read every profile in their own workshop
create policy "staff_read_workshop_profiles" on public.profiles
  for select using (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );

-- customers: staff can read/write every customer in their workshop
create policy "staff_all_customers" on public.customers
  for all using (
    public.is_staff() and workshop_id = public.current_workshop_id()
  )
  with check (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );

-- customers: a customer can read only their own customer record
create policy "customer_read_own_record" on public.customers
  for select using (
    public.current_role() = 'customer' and profile_id = auth.uid()
  );

-- vehicles: staff can read/write every vehicle in their workshop
create policy "staff_all_vehicles" on public.vehicles
  for all using (
    public.is_staff() and workshop_id = public.current_workshop_id()
  )
  with check (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );

-- vehicles: a customer can read only vehicles linked to their own customer record
create policy "customer_read_own_vehicles" on public.vehicles
  for select using (
    public.current_role() = 'customer'
    and customer_id in (
      select id from public.customers where profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Auto-create a profile row whenever someone signs up through Supabase Auth
--
-- New logins default to role "customer" with no workshop assigned yet
-- (a customer's profile gets linked to a workshop once an admin matches
-- them to a customer record — see the "customers" table above). Staff
-- accounts (technician/admin/owner) are never created by public signup;
-- they're created directly by an admin/owner with the role and
-- workshop_id set explicitly.
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, workshop_id, role, email, phone)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'workshop_id')::uuid,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    new.email,
    new.phone
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
