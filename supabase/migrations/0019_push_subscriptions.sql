-- Web Push subscriptions. Each browser that turns on notifications
-- (tech or admin/owner) registers one row here. The server uses these
-- to push a notification when something they care about happens —
-- no app store, no native build.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Staff can only see/manage their own subscription rows. Sending
-- happens server-side via the service-role client, which bypasses RLS.
create policy "staff manage own push subscriptions" on public.push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and workshop_id = public.current_workshop_id());
