-- Review fix: admin/owner could read their workshop but never update it
-- (e.g. saving the connected Stripe account id) — there was no update
-- policy at all, so the write silently did nothing under RLS.

create policy "admin_owner_update_workshop" on public.workshops
  for update using (
    public.current_role() in ('admin', 'owner') and id = public.current_workshop_id()
  )
  with check (
    public.current_role() in ('admin', 'owner') and id = public.current_workshop_id()
  );
