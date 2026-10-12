import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  workshop_id: string | null;
  role: "customer" | "technician" | "admin" | "owner";
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
};

/**
 * Reads the currently logged-in user (if any) plus their profile row,
 * and whether they've completed a two-factor challenge this session.
 * Returns null fields when nobody is logged in.
 */
export async function getSessionProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, isTwoFactorVerified: false };
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const isTwoFactorVerified = aal?.currentLevel === "aal2";

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, workshop_id, role, first_name, last_name, phone, email")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null, isTwoFactorVerified };
}
