-- Phase 3: jobs (the actual workflow once a car is checked in) and
-- time_entries (the automatic time clock).
--
-- A booking becomes a job when the car is checked in. Status flow:
--   checked_in -> on_lift -> [waiting_on_parts <-> on_lift] -> road_test -> ready
-- "on_lift" and "road_test" are the two states where the clock runs;
-- every other state pauses it. (inspecting/awaiting_approval are
-- included now for Phase 5 even though nothing sets them yet.)

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  booking_id uuid unique references public.bookings (id),
  vehicle_id uuid not null references public.vehicles (id),
  customer_id uuid not null references public.customers (id),
  assigned_tech_id uuid references public.profiles (id),
  bay_id uuid references public.bays (id),
  status text not null default 'checked_in' check (
    status in (
      'checked_in', 'inspecting', 'awaiting_approval', 'on_lift',
      'waiting_on_parts', 'road_test', 'ready', 'paid', 'cancelled'
    )
  ),
  promised_at timestamptz,
  customer_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  job_id uuid not null references public.jobs (id),
  tech_id uuid not null references public.profiles (id),
  started_at timestamptz not null default now(),
  stopped_at timestamptz
);

alter table public.jobs enable row level security;
alter table public.time_entries enable row level security;

-- jobs: admin/owner can do anything within their workshop
create policy "admin_owner_all_jobs" on public.jobs
  for all using (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  )
  with check (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  );

-- jobs: a technician can see every job in their workshop (useful context)
-- but can only update jobs assigned to them specifically
create policy "technician_read_jobs" on public.jobs
  for select using (
    public.current_role() = 'technician' and workshop_id = public.current_workshop_id()
  );

create policy "technician_update_own_jobs" on public.jobs
  for update using (
    public.current_role() = 'technician'
    and workshop_id = public.current_workshop_id()
    and assigned_tech_id = auth.uid()
  )
  with check (
    public.current_role() = 'technician'
    and workshop_id = public.current_workshop_id()
    and assigned_tech_id = auth.uid()
  );

-- jobs: a customer can see only their own jobs (useful from Phase 4 onward)
create policy "customer_read_own_jobs" on public.jobs
  for select using (
    public.current_role() = 'customer'
    and customer_id in (
      select id from public.customers where profile_id = auth.uid()
    )
  );

-- time_entries: admin/owner see everything in their workshop
create policy "admin_owner_all_time_entries" on public.time_entries
  for all using (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  )
  with check (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  );

-- time_entries: a technician can only manage their own
create policy "technician_own_time_entries" on public.time_entries
  for all using (
    public.current_role() = 'technician'
    and workshop_id = public.current_workshop_id()
    and tech_id = auth.uid()
  )
  with check (
    public.current_role() = 'technician'
    and workshop_id = public.current_workshop_id()
    and tech_id = auth.uid()
  );
