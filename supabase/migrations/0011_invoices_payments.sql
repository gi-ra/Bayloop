-- Phase 6: invoices and payments.
-- GST: prices are entered GST-inclusive (standard practice for
-- consumer-facing quotes), so gst = total / 11, subtotal = total - gst.

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  job_id uuid not null references public.jobs (id),
  customer_id uuid not null references public.customers (id),
  subtotal numeric not null,
  gst numeric not null,
  total numeric not null,
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'partially_paid', 'paid', 'void')
  ),
  stripe_checkout_session_id text,
  stripe_checkout_url text,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id),
  invoice_id uuid not null references public.invoices (id),
  amount numeric not null,
  method text not null,
  stripe_payment_intent_id text,
  paid_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
alter table public.payments enable row level security;

create policy "staff_all_invoices" on public.invoices
  for all using (public.is_staff() and workshop_id = public.current_workshop_id())
  with check (public.is_staff() and workshop_id = public.current_workshop_id());

create policy "customer_read_own_invoices" on public.invoices
  for select using (
    public.current_role() = 'customer'
    and customer_id in (
      select id from public.customers where profile_id = auth.uid()
    )
  );

create policy "staff_all_payments" on public.payments
  for all using (public.is_staff() and workshop_id = public.current_workshop_id())
  with check (public.is_staff() and workshop_id = public.current_workshop_id());

create policy "customer_read_own_payments" on public.payments
  for select using (
    public.current_role() = 'customer'
    and invoice_id in (
      select i.id from public.invoices i
      join public.customers c on c.id = i.customer_id
      where c.profile_id = auth.uid()
    )
  );
