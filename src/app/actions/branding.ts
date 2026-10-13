"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateBranding(formData: FormData) {
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

  const brandColor = formData.get("brand_color") as string;
  const logoUrl = (formData.get("logo_url") as string) || null;

  const { error, data } = await supabase
    .from("workshops")
    .update({ brand_color: brandColor, logo_url: logoUrl })
    .eq("id", profile.workshop_id)
    .select("id");
  if (error || !data || data.length === 0) {
    throw new Error(error?.message ?? "Could not save branding");
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/portal/login");
}
