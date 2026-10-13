-- Logo upload storage. Unlike job-photos, this bucket is PUBLIC —
-- a workshop's logo needs to be visible to anyone on the public
-- homepage/booking page, not just logged-in staff/customers.
--
-- Before running this, create a bucket called "workshop-logos" in the
-- Supabase dashboard (Storage -> New bucket), set to PUBLIC this time.
-- Path convention: {workshop_id}/logo-{filename}

create policy "staff_upload_workshop_logo" on storage.objects
  for insert with check (
    bucket_id = 'workshop-logos'
    and public.is_staff()
    and (storage.foldername(name))[1] = public.current_workshop_id()::text
  );

create policy "staff_update_workshop_logo" on storage.objects
  for update using (
    bucket_id = 'workshop-logos'
    and public.is_staff()
    and (storage.foldername(name))[1] = public.current_workshop_id()::text
  );

-- No read policy needed — the bucket is public, so anyone can view
-- logos without going through row-level security at all.
