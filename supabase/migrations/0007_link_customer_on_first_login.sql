-- Review fix: someone who books online never needs to log in first, so
-- a `customers` row can exist with no linked login yet. When they later
-- log in with a matching phone number, link it automatically so their
-- existing bookings/vehicles show up in their portal immediately.

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

  if new.phone is not null then
    update public.customers
    set profile_id = new.id
    where phone = new.phone and profile_id is null;
  end if;

  return new;
end;
$$;
