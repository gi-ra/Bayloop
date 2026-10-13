"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getOwnWorkshopId() {
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

  return { supabase, workshopId: profile.workshop_id as string };
}

function revalidateBrandedPages() {
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/book");
  revalidatePath("/portal/login");
}

export async function updateBrandColor(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshopId();
  const brandColor = formData.get("brand_color") as string;

  const { error, data } = await supabase
    .from("workshops")
    .update({ brand_color: brandColor })
    .eq("id", workshopId)
    .select("id");
  if (error || !data || data.length === 0) {
    throw new Error(error?.message ?? "Could not save brand color");
  }

  revalidateBrandedPages();
}

export async function setWorkshopLogo(logoUrl: string) {
  const { supabase, workshopId } = await getOwnWorkshopId();

  const { error, data } = await supabase
    .from("workshops")
    .update({ logo_url: logoUrl })
    .eq("id", workshopId)
    .select("id");
  if (error || !data || data.length === 0) {
    throw new Error(error?.message ?? "Could not save logo");
  }

  revalidateBrandedPages();
}

export async function removeWorkshopLogo() {
  const { supabase, workshopId } = await getOwnWorkshopId();

  const { error, data } = await supabase
    .from("workshops")
    .update({ logo_url: null })
    .eq("id", workshopId)
    .select("id");
  if (error || !data || data.length === 0) {
    throw new Error(error?.message ?? "Could not remove logo");
  }

  revalidateBrandedPages();
}
