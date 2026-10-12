"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_INSPECTION_ITEMS = [
  "Tyres & tread depth",
  "Brakes — pads/rotors",
  "Battery",
  "Lights",
  "Fluid levels",
  "Belts & hoses",
  "Suspension & steering",
  "Exhaust",
  "Wipers",
  "Horn",
];

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

  return { supabase, workshopId: profile.workshop_id as string, userId: user.id };
}

export async function startInspection(formData: FormData) {
  const { supabase, workshopId, userId } = await getOwnWorkshopId();
  const jobId = formData.get("job_id") as string;

  const { data: inspection, error } = await supabase
    .from("inspections")
    .insert({ workshop_id: workshopId, job_id: jobId, created_by: userId })
    .select("id")
    .single();
  if (error || !inspection) throw new Error(error?.message ?? "Could not start inspection");

  const items = DEFAULT_INSPECTION_ITEMS.map((label, i) => ({
    workshop_id: workshopId,
    inspection_id: inspection.id,
    label,
    sort_order: i,
  }));
  const { error: itemsError } = await supabase.from("inspection_items").insert(items);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath(`/tech/jobs/${jobId}`);
}

export async function updateInspectionItem(formData: FormData) {
  const { supabase } = await getOwnWorkshopId();
  const itemId = formData.get("item_id") as string;
  const jobId = formData.get("job_id") as string;
  const rating = formData.get("rating") as string;
  const notes = (formData.get("notes") as string) || null;
  const measurement = (formData.get("measurement") as string) || null;

  const { error } = await supabase
    .from("inspection_items")
    .update({ rating, notes, measurement })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/tech/jobs/${jobId}`);
}

export async function addInspectionItemPhoto(itemId: string, jobId: string, path: string) {
  const { supabase } = await getOwnWorkshopId();

  const { data: item } = await supabase
    .from("inspection_items")
    .select("photo_urls")
    .eq("id", itemId)
    .single();

  const { error } = await supabase
    .from("inspection_items")
    .update({ photo_urls: [...(item?.photo_urls ?? []), path] })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/tech/jobs/${jobId}`);
}
