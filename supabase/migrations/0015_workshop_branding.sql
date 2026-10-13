-- Per-workshop branding: each workshop can set its own logo and brand
-- color, applied across the pages its own customers see (home, booking,
-- login, live tracker). Staff-facing pages (admin/tech/staff login)
-- stay consistently Bayloop-branded — that's the tool, not the product
-- the workshop's customers see.

alter table public.workshops
  add column logo_url text,
  add column brand_color text not null default '#2F7A73';
