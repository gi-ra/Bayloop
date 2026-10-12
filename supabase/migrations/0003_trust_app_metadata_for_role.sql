-- Security fix: the original handle_new_user() trusted `role` from
-- raw_user_meta_data, which is set by the CLIENT during signup (anyone
-- calling the public API directly could request role: "admin"). Roles
-- must only ever come from raw_app_meta_data, which can only be set
-- using the service-role key — never by a public signup request.

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, workshop_id, role, email, phone)
  values (
    new.id,
    (new.raw_app_meta_data ->> 'workshop_id')::uuid,
    coalesce(new.raw_app_meta_data ->> 'role', 'customer'),
    new.email,
    new.phone
  );
  return new;
end;
$$;
