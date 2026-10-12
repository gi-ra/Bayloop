-- Phase 4: messages log + a secret token per job for the public
-- live-tracker page (no login needed — knowing the link is enough,
-- same idea as a food-delivery tracking link).

alter table public.jobs
  add column tracker_token uuid not null default gen_random_uuid() unique;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  job_id uuid references public.jobs (id),
  customer_id uuid references public.customers (id),
  channel text not null check (channel in ('sms', 'email')),
  direction text not null check (direction in ('outbound', 'inbound')),
  body text not null,
  sent_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "staff_all_messages" on public.messages
  for all using (
    public.is_staff() and workshop_id = public.current_workshop_id()
  )
  with check (
    public.is_staff() and workshop_id = public.current_workshop_id()
  );

create policy "customer_read_own_messages" on public.messages
  for select using (
    public.current_role() = 'customer'
    and customer_id in (
      select id from public.customers where profile_id = auth.uid()
    )
  );

-- Lets the public tracker page look up a job by its secret token
-- without needing to log in, and without exposing any other job.
create or replace function public.get_job_by_tracker_token(p_token uuid)
returns table (
  status text,
  promised_at timestamptz,
  vehicle_make text,
  vehicle_model text,
  vehicle_rego text,
  service_name text
)
language sql stable security definer set search_path = public
as $$
  select j.status, j.promised_at, v.make, v.model, v.rego, s.name
  from public.jobs j
  join public.vehicles v on v.id = j.vehicle_id
  left join public.bookings b on b.id = j.booking_id
  left join public.services s on s.id = b.service_id
  where j.tracker_token = p_token;
$$;

grant execute on function public.get_job_by_tracker_token(uuid) to anon, authenticated;
