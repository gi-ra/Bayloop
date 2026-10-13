"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  return { supabase, workshopId: profile.workshop_id as string, userId: user.id };
}

export async function requestPart(formData: FormData) {
  const { supabase, workshopId, userId } = await getOwnWorkshop();
  const jobId = formData.get("job_id") as string;
  const description = formData.get("description") as string;

  const { error } = await supabase.from("parts_requests").insert({
    workshop_id: workshopId,
    job_id: jobId,
    requested_by: userId,
    description,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/tech/jobs/${jobId}`);
  revalidatePath("/admin/parts");
}

export async function orderPart(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshop();
  const partsRequestId = formData.get("parts_request_id") as string;
  const supplierName = formData.get("supplier_name") as string;
  const partNumber = (formData.get("part_number") as string) || null;
  const cost = formData.get("cost") ? Number(formData.get("cost")) : null;
  const quotedPrice = formData.get("quoted_price") ? Number(formData.get("quoted_price")) : null;
  const expectedAt = (formData.get("expected_at") as string) || null;

  let supplierId: string | null = null;
  if (supplierName) {
    const { data: existing } = await supabase
      .from("suppliers")
      .select("id")
      .eq("workshop_id", workshopId)
      .ilike("name", supplierName)
      .maybeSingle();
    if (existing) {
      supplierId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("suppliers")
        .insert({ workshop_id: workshopId, name: supplierName })
        .select("id")
        .single();
      if (error || !created) throw new Error(error?.message ?? "Could not create supplier");
      supplierId = created.id;
    }
  }

  const { error: poError } = await supabase.from("purchase_orders").insert({
    workshop_id: workshopId,
    supplier_id: supplierId,
    parts_request_id: partsRequestId,
    part_number: partNumber,
    cost,
    quoted_price: quotedPrice,
    expected_at: expectedAt,
  });
  if (poError) throw new Error(poError.message);

  const { error: updateError } = await supabase
    .from("parts_requests")
    .update({ status: "ordered" })
    .eq("id", partsRequestId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/admin/parts");
}

export async function receivePart(formData: FormData) {
  const { supabase } = await getOwnWorkshop();
  const purchaseOrderId = formData.get("purchase_order_id") as string;
  const partsRequestId = formData.get("parts_request_id") as string;

  const { error: poError } = await supabase
    .from("purchase_orders")
    .update({ received_at: new Date().toISOString() })
    .eq("id", purchaseOrderId);
  if (poError) throw new Error(poError.message);

  const { error: prError } = await supabase
    .from("parts_requests")
    .update({ status: "received" })
    .eq("id", partsRequestId);
  if (prError) throw new Error(prError.message);

  revalidatePath("/admin/parts");
}

export async function upsertStockItem(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshop();
  const id = formData.get("id") as string | null;

  const values = {
    workshop_id: workshopId,
    sku: (formData.get("sku") as string) || null,
    name: formData.get("name") as string,
    qty_on_hand: Number(formData.get("qty_on_hand")) || 0,
    low_stock_threshold: Number(formData.get("low_stock_threshold")) || 0,
    unit_cost: formData.get("unit_cost") ? Number(formData.get("unit_cost")) : null,
  };

  const { error } = id
    ? await supabase.from("stock_items").update(values).eq("id", id)
    : await supabase.from("stock_items").insert(values);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/stock");
}
