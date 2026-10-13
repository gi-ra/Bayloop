-- Phase 7: parts requests, purchase orders, suppliers, stock.
-- Real cost from purchase_orders.cost feeds "true job profit" in Phase 8.

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.parts_requests (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  job_id uuid not null references public.jobs (id),
  requested_by uuid references public.profiles (id),
  description text not null,
  status text not null default 'requested' check (
    status in ('requested', 'ordered', 'received', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  supplier_id uuid references public.suppliers (id),
  parts_request_id uuid references public.parts_requests (id),
  part_number text,
  cost numeric,
  quoted_price numeric,
  expected_at date,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.stock_items (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  sku text,
  name text not null,
  qty_on_hand int not null default 0,
  low_stock_threshold int not null default 0,
  unit_cost numeric,
  created_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;
alter table public.parts_requests enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.stock_items enable row level security;

-- Suppliers, purchase orders, and stock all carry cost/pricing data —
-- admin/owner only, same rule as invoices and quotes (technicians see
-- jobs, not prices).
create policy "admin_owner_all_suppliers" on public.suppliers
  for all using (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  )
  with check (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  );

-- Parts requests have no cost data (just "what's needed"), so any staff
-- member — including the technician who asked for it — can see the queue.
create policy "staff_all_parts_requests" on public.parts_requests
  for all using (public.is_staff() and workshop_id = public.current_workshop_id())
  with check (public.is_staff() and workshop_id = public.current_workshop_id());

create policy "admin_owner_all_purchase_orders" on public.purchase_orders
  for all using (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  )
  with check (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  );

create policy "admin_owner_all_stock_items" on public.stock_items
  for all using (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  )
  with check (
    public.current_role() in ('admin', 'owner') and workshop_id = public.current_workshop_id()
  );
