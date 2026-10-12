"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
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

export async function createAndSendInvoice(formData: FormData) {
  const { supabase, workshopId } = await getOwnWorkshopId();
  const jobId = formData.get("job_id") as string;

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, customer_id, vehicles(make, model, rego), customers(phone, email)")
    .eq("id", jobId)
    .single();
  if (jobError || !job) throw new Error("Job not found");

  const { data: quote } = await supabase
    .from("quotes")
    .select("id")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: approvedLines } = await supabase
    .from("quote_lines")
    .select("qty, unit_price")
    .eq("quote_id", quote?.id ?? "")
    .eq("approved", true);

  const total = (approvedLines ?? []).reduce((sum, l) => sum + l.qty * l.unit_price, 0);
  if (total <= 0) throw new Error("No approved quote lines to invoice");

  const gst = Math.round((total / 11) * 100) / 100;
  const subtotal = Math.round((total - gst) * 100) / 100;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      workshop_id: workshopId,
      job_id: jobId,
      customer_id: job.customer_id,
      subtotal,
      gst,
      total,
      status: "sent",
    })
    .select("id")
    .single();
  if (invoiceError || !invoice) throw new Error(invoiceError?.message ?? "Could not create invoice");

  const vehicle = job.vehicles as unknown as {
    make: string | null;
    model: string | null;
    rego: string | null;
  } | null;
  const customer = job.customers as unknown as { phone: string | null; email: string | null } | null;

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: `${vehicle?.make ?? ""} ${vehicle?.model ?? ""} (${vehicle?.rego ?? ""})`.trim(),
          },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${SITE_URL}/portal/jobs/${jobId}?paid=1`,
    cancel_url: `${SITE_URL}/portal/jobs/${jobId}`,
    metadata: { invoice_id: invoice.id },
  });

  const payUrl = session.url!;
  await supabase
    .from("invoices")
    .update({ stripe_checkout_session_id: session.id, stripe_checkout_url: payUrl })
    .eq("id", invoice.id);

  if (customer?.phone) {
    await sendSms(
      customer.phone,
      `Your car is ready! Total: $${total.toFixed(2)}. Pay online: ${payUrl}`,
      { workshopId, customerId: job.customer_id },
    );
  }
  if (customer?.email) {
    await sendEmail(
      customer.email,
      "Your invoice — Boyta Auto Centre",
      `<p>Your car is ready! Total: $${total.toFixed(2)}.</p><p><a href="${payUrl}">Pay online</a></p>`,
      { workshopId, customerId: job.customer_id },
    );
  }

  revalidatePath(`/admin/jobs/${jobId}`);
}
