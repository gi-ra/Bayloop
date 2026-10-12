-- The public site (booking form, homepage) needs basic workshop info
-- like name, phone, and address. None of this is sensitive, so it's
-- safe to make readable by anyone.

create policy "anyone_read_workshops" on public.workshops
  for select using (true);
