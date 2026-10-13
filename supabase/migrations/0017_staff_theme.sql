-- Lets a workshop choose a dark theme for staff-facing login pages
-- (customer-facing pages stay light/branded regardless).

alter table public.workshops
  add column staff_theme text not null default 'light' check (staff_theme in ('light', 'dark'));
