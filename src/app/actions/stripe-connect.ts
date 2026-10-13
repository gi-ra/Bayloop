"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getOwnWorkshop() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", user.id)
    .single();
  if (!profile?.workshop_id) throw new Error("No workshop on this account");

  const { data: workshop } = await supabase
    .from("workshops")
    .select("id, stripe_account_id, stripe_onboarding_complete")
    .eq("id", profile.workshop_id)
    .single();
  if (!workshop) throw new Error("Workshop not found");

  return { supabase, workshop };
}

// Starts (or resumes) connecting the workshop's own Stripe account.
// Redirects the admin to Stripe's own hosted onboarding form.
export async function connectStripe() {
  const { supabase, workshop } = await getOwnWorkshop();
  const stripe = getStripe();

  let accountId = workshop.stripe_account_id;

  if (!accountId) {
    const account = await stripe.v2.core.accounts.create({
      display_name: "Boyta Auto Centre",
      dashboard: "full",
      identity: { country: "au" },
      configuration: {
        merchant: {
          capabilities: {
            card_payments: { requested: true },
          },
        },
      },
      defaults: {
        currency: "aud",
        responsibilities: {
          fees_collector: "stripe",
          losses_collector: "stripe",
        },
      },
    });
    accountId = account.id;

    const { error, data } = await supabase
      .from("workshops")
      .update({ stripe_account_id: accountId })
      .eq("id", workshop.id)
      .select("id");
    if (error || !data || data.length === 0) {
      throw new Error(error?.message ?? "Could not save the connected Stripe account");
    }
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${SITE_URL}/admin/settings`,
    return_url: `${SITE_URL}/admin/settings?stripe_return=1`,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}

// Called when the admin lands back from Stripe onboarding — checks
// whether the account is actually ready to take payments yet.
export async function refreshStripeStatus() {
  const { supabase, workshop } = await getOwnWorkshop();
  if (!workshop.stripe_account_id) return;

  const stripe = getStripe();
  const account = await stripe.v2.core.accounts.retrieve(workshop.stripe_account_id);
  const ready = account.configuration?.merchant?.capabilities?.card_payments?.status === "active";

  const { error, data } = await supabase
    .from("workshops")
    .update({ stripe_onboarding_complete: ready })
    .eq("id", workshop.id)
    .select("id");
  if (error || !data || data.length === 0) {
    throw new Error(error?.message ?? "Could not save Stripe connection status");
  }
}
