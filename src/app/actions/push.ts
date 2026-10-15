"use server";

import { createClient } from "@/lib/supabase/server";

type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

// Saves a browser's push subscription against the signed-in staff
// member. Uses the regular (RLS-respecting) client — a person can only
// ever write their own subscription row, enforced at the database.
export async function subscribeToPush(subscription: SubscriptionInput) {
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

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      workshop_id: profile.workshop_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(error.message);
}

export async function unsubscribeFromPush(endpoint: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}
