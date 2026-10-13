"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MANAGEABLE_ROLES = ["technician", "admin"];

async function requireAdminOrOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("workshop_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "owner"].includes(profile.role)) {
    throw new Error("Only admin/owner can manage staff");
  }
  if (!profile.workshop_id) throw new Error("No workshop on this account");

  return { workshopId: profile.workshop_id as string };
}

export async function createStaffAccount(formData: FormData) {
  const { workshopId } = await requireAdminOrOwner();

  const email = formData.get("email") as string;
  const firstName = formData.get("first_name") as string;
  const lastName = formData.get("last_name") as string;
  const role = formData.get("role") as string;
  const password = formData.get("password") as string;

  if (!MANAGEABLE_ROLES.includes(role)) {
    throw new Error("Role must be technician or admin");
  }

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role, workshop_id: workshopId },
  });
  if (error || !created.user) throw new Error(error?.message ?? "Could not create account");

  await admin
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("id", created.user.id);

  revalidatePath("/admin/staff");
}

// Resets a staff member's two-factor enrollment — use when they've lost
// their phone/authenticator app. They'll be prompted to set up a new
// one next time they log in.
export async function resetStaffTwoFactor(formData: FormData) {
  const { workshopId } = await requireAdminOrOwner();
  const userId = formData.get("user_id") as string;

  // The admin client can reach any user in the project — confirm this
  // target is actually one of *this* workshop's own staff first.
  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", userId)
    .single();
  if (!target || target.workshop_id !== workshopId) {
    throw new Error("That staff member isn't part of your workshop");
  }

  const admin = createAdminClient();
  const { data: factors, error: listError } = await admin.auth.admin.mfa.listFactors({
    userId,
  });
  if (listError) throw new Error(listError.message);

  for (const factor of factors?.factors ?? []) {
    const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId,
    });
    if (deleteError) throw new Error(deleteError.message);
  }

  revalidatePath("/admin/staff");
}
