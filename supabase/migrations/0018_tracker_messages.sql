-- Lets a customer send a message from the public live-tracker page
-- (no login needed — same spirit as the tracker itself). Lands in the
-- admin inbox alongside SMS replies.

alter table public.messages drop constraint messages_channel_check;
alter table public.messages add constraint messages_channel_check
  check (channel in ('sms', 'email', 'web'));

create or replace function public.send_tracker_message(p_token uuid, p_body text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_workshop_id uuid;
  v_customer_id uuid;
begin
  select j.workshop_id, j.customer_id into v_workshop_id, v_customer_id
  from public.jobs j
  where j.tracker_token = p_token;

  if v_workshop_id is null then
    raise exception 'Invalid tracking link';
  end if;

  if length(trim(p_body)) = 0 or length(p_body) > 1000 then
    raise exception 'Message must be between 1 and 1000 characters';
  end if;

  insert into public.messages (workshop_id, customer_id, channel, direction, body)
  values (v_workshop_id, v_customer_id, 'web', 'inbound', p_body);
end;
$$;

grant execute on function public.send_tracker_message(uuid, text) to anon, authenticated;
