-- Placeholder bays and services for Boyta Auto Centre.
-- Easy to edit later — just update these rows (or ask Claude Code to).

insert into public.bays (workshop_id, name)
select id, bay_name
from public.workshops, unnest(array['Bay 1', 'Bay 2']) as bay_name
where workshops.name = 'Boyta Auto Centre';

insert into public.services (workshop_id, name, description, price_min, price_max, estimated_minutes)
select workshops.id, s.name, s.description, s.price_min, s.price_max, s.estimated_minutes
from public.workshops, (values
  ('Logbook service', 'Manufacturer-scheduled service to keep your warranty valid', 180, 350, 60),
  ('Brake service', 'Pad and/or rotor inspection and replacement', 150, 450, 90),
  ('Tyre service', 'Fitting, balancing, rotation', 40, 300, 45),
  ('Air conditioning service', 'Regas and system check', 120, 220, 60),
  ('Safety certificate (roadworthy)', 'Inspection for a roadworthy/safety certificate', 60, 120, 45)
) as s(name, description, price_min, price_max, estimated_minutes)
where workshops.name = 'Boyta Auto Centre';
