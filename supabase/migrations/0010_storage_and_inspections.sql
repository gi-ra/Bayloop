-- Phase 5: storage policies for job/inspection photos, plus the
-- inspections and quotes schema.
--
-- Before running this, create a bucket called "job-photos" in the
-- Supabase dashboard (Storage -> New bucket), set to private (not
-- public). Photos are organised as: {workshop_id}/{job_id}/{filename}

create policy "staff_upload_job_photos" on storage.objects
  for insert with check (
    bucket_id = 'job-photos'
    and public.is_staff()
    and (storage.foldername(name))[1] = public.current_workshop_id()::text
  );

create policy "staff_read_job_photos" on storage.objects
  for select using (
    bucket_id = 'job-photos'
    and public.is_staff()
    and (storage.foldername(name))[1] = public.current_workshop_id()::text
  );

-- A customer can view photos for their own jobs (path is
-- {workshop_id}/{job_id}/{filename} — segment 2 is the job id).
create policy "customer_read_own_job_photos" on storage.objects
  for select using (
    bucket_id = 'job-photos'
    and public.current_role() = 'customer'
    and (storage.foldername(name))[2]::uuid in (
      select j.id from public.jobs j
      join public.customers c on c.id = j.customer_id
      where c.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Inspections
-- ---------------------------------------------------------------------

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  job_id uuid not null references public.jobs (id),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.inspection_items (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  inspection_id uuid not null references public.inspections (id),
  label text not null,
  rating text check (rating in ('good', 'monitor', 'urgent')),
  notes text,
  measurement text,
  photo_urls text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.inspections enable row level security;
alter table public.inspection_items enable row level security;

create policy "staff_all_inspections" on public.inspections
  for all using (public.is_staff() and workshop_id = public.current_workshop_id())
  with check (public.is_staff() and workshop_id = public.current_workshop_id());

create policy "customer_read_own_inspections" on public.inspections
  for select using (
    public.current_role() = 'customer'
    and job_id in (
      select j.id from public.jobs j
      join public.customers c on c.id = j.customer_id
      where c.profile_id = auth.uid()
    )
  );

create policy "staff_all_inspection_items" on public.inspection_items
  for all using (public.is_staff() and workshop_id = public.current_workshop_id())
  with check (public.is_staff() and workshop_id = public.current_workshop_id());

create policy "customer_read_own_inspection_items" on public.inspection_items
  for select using (
    public.current_role() = 'customer'
    and inspection_id in (
      select i.id from public.inspections i
      join public.jobs j on j.id = i.job_id
      join public.customers c on c.id = j.customer_id
      where c.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Quotes
-- ---------------------------------------------------------------------

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  job_id uuid not null references public.jobs (id),
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'approved', 'declined', 'partially_approved')
  ),
  created_at timestamptz not null default now()
);

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  quote_id uuid not null references public.quotes (id),
  inspection_item_id uuid references public.inspection_items (id),
  type text not null check (type in ('part', 'labour')),
  description text not null,
  tier text check (tier in ('good', 'better', 'best')),
  qty numeric not null default 1,
  unit_price numeric not null,
  approved boolean,
  decided_at timestamptz,
  decided_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;
alter table public.quote_lines enable row level security;

create policy "staff_all_quotes" on public.quotes
  for all using (public.is_staff() and workshop_id = public.current_workshop_id())
  with check (public.is_staff() and workshop_id = public.current_workshop_id());

create policy "customer_read_own_quotes" on public.quotes
  for select using (
    public.current_role() = 'customer'
    and job_id in (
      select j.id from public.jobs j
      join public.customers c on c.id = j.customer_id
      where c.profile_id = auth.uid()
    )
  );

create policy "staff_all_quote_lines" on public.quote_lines
  for all using (public.is_staff() and workshop_id = public.current_workshop_id())
  with check (public.is_staff() and workshop_id = public.current_workshop_id());

create policy "customer_read_own_quote_lines" on public.quote_lines
  for select using (
    public.current_role() = 'customer'
    and quote_id in (
      select q.id from public.quotes q
      join public.jobs j on j.id = q.job_id
      join public.customers c on c.id = j.customer_id
      where c.profile_id = auth.uid()
    )
  );

-- A customer approving/declining a line is NOT a raw table update policy
-- (a plain "update" policy can't restrict which columns change, so a
-- crafted request could alter price/description too). Instead, this
-- function only ever touches approved/decided_at/decided_by, and only
-- for the caller's own, still-pending line.
create or replace function public.customer_decide_quote_line(p_line_id uuid, p_approved boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_owns_line boolean;
begin
  select exists (
    select 1
    from public.quote_lines ql
    join public.quotes q on q.id = ql.quote_id
    join public.jobs j on j.id = q.job_id
    join public.customers c on c.id = j.customer_id
    where ql.id = p_line_id
      and ql.approved is null
      and c.profile_id = auth.uid()
  ) into v_owns_line;

  if not v_owns_line then
    raise exception 'Quote line not found, not yours, or already decided';
  end if;

  update public.quote_lines
  set approved = p_approved, decided_at = now()
  where id = p_line_id;
end;
$$;

grant execute on function public.customer_decide_quote_line(uuid, boolean) to authenticated;
