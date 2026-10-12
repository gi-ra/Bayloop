import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// This one endpoint receives both the platform's own events and events
// from connected (workshop) accounts — when creating the webhook in the
// Stripe dashboard, enable "listen to events on connected accounts" so
// payments made on a workshop's own Stripe account reach this handler.
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const invoiceId = session.metadata?.invoice_id;
    if (invoiceId) {
      const admin = createAdminClient();

      const { data: invoice } = await admin
        .from("invoices")
        .select("id, workshop_id, job_id, total, status")
        .eq("id", invoiceId)
        .single();

      // Stripe can retry the same event — don't double-record a payment.
      if (invoice && invoice.status !== "paid") {
        await admin.from("payments").insert({
          workshop_id: invoice.workshop_id,
          invoice_id: invoice.id,
          amount: invoice.total,
          method: "card",
          stripe_payment_intent_id: session.payment_intent as string,
        });
        await admin.from("invoices").update({ status: "paid" }).eq("id", invoice.id);
        await admin.from("jobs").update({ status: "paid" }).eq("id", invoice.job_id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
