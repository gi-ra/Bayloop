"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function createCustomer(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshopId();

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      workshop_id: workshopId,
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || null,
    })
    .select("id")
    .single();

  if (error || !customer) throw new Error(error?.message ?? "Could not create customer");

  revalidatePath("/admin/customers");
  redirect(`/admin/customers/${customer.id}`);
}

export async function createVehicle(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshopId();
  const customerId = formData.get("customer_id") as string;

  const { error } = await supabase.from("vehicles").insert({
    workshop_id: workshopId,
    customer_id: customerId,
    rego: formData.get("rego") as string,
    make: (formData.get("make") as string) || null,
    model: (formData.get("model") as string) || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/customers/${customerId}`);
}
