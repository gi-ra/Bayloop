"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms";
import { sendEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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

async function getOrCreateDraftQuote(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workshopId: string,
  jobId: string,
) {
  const { data: existing } = await supabase
    .from("quotes")
    .select("id")
    .eq("job_id", jobId)
    .eq("status", "draft")
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("quotes")
    .insert({ workshop_id: workshopId, job_id: jobId, status: "draft" })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not create quote");
  return created.id as string;
}

export async function addQuoteLine(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshopId();
  const jobId = formData.get("job_id") as string;
  const quoteId = await getOrCreateDraftQuote(supabase, workshopId, jobId);

  const { error } = await supabase.from("quote_lines").insert({
    workshop_id: workshopId,
    quote_id: quoteId,
    inspection_item_id: (formData.get("inspection_item_id") as string) || null,
    type: formData.get("type") as string,
    description: formData.get("description") as string,
    tier: (formData.get("tier") as string) || null,
    qty: Number(formData.get("qty")) || 1,
    unit_price: Number(formData.get("unit_price")),
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function sendQuote(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshopId();
  const jobId = formData.get("job_id") as string;

  const { data: quote } = await supabase
    .from("quotes")
    .select("id")
    .eq("job_id", jobId)
    .eq("status", "draft")
    .single();
  if (!quote) throw new Error("No draft quote to send");

  const { error } = await supabase
    .from("quotes")
    .update({ status: "sent" })
    .eq("id", quote.id);
  if (error) throw new Error(error.message);

  await supabase.from("jobs").update({ status: "awaiting_approval" }).eq("id", jobId);

  const { data: job } = await supabase
    .from("jobs")
    .select("tracker_token, customers(phone, email)")
    .eq("id", jobId)
    .single();
  const customer = job?.customers as unknown as { phone: string | null; email: string | null } | null;
  const portalUrl = `${SITE_URL}/portal`;

  if (customer?.phone) {
    await sendSms(
      customer.phone,
      `Your inspection is done and a quote is ready to review. Log in to approve: ${portalUrl}`,
      { workshopId },
    );
  }
  if (customer?.email) {
    await sendEmail(
      customer.email,
      "Your quote is ready — Boyta Auto Centre",
      `<p>Your inspection is done and a quote is ready to review.</p><p><a href="${portalUrl}">Log in to approve</a></p>`,
      { workshopId },
    );
  }

  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function customerDecideQuoteLine(formData: FormData) {
  const supabase = await createClient();
  const lineId = formData.get("line_id") as string;
  const approved = formData.get("approved") === "true";

  const { error } = await supabase.rpc("customer_decide_quote_line", {
    p_line_id: lineId,
    p_approved: approved,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/portal");
}
