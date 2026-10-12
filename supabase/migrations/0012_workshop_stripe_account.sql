-- Phase 6 (Connect): each workshop connects its own Stripe account.
-- Bayloop's own Stripe account becomes the "platform" account (enables
-- Connect) — it never directly processes a workshop's customer payments.

alter table public.workshops
  add column stripe_account_id text,
  add column stripe_onboarding_complete boolean not null default false;
