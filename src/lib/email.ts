import { createAdminClient } from "@/lib/supabase/admin";

type LogContext = { workshopId: string; customerId?: string | null };

// Sends an email via Resend and logs it to the inbox. Without an API
// key configured, logs to the console instead of sending, so the app
// keeps working in early development.
export async function sendEmail(to: string, subject: string, html: string, log?: LogContext) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email stub — no Resend API key set] to=${to}: ${subject}`);
  } else {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // onboarding@resend.dev works without verifying your own domain —
        // switch this to a Boyta Auto Centre address once a domain is set up.
        from: "Bayloop <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error(`Resend email failed (${response.status}):`, await response.text());
    }
  }

  if (log) {
    const admin = createAdminClient();
    await admin.from("messages").insert({
      workshop_id: log.workshopId,
      customer_id: log.customerId ?? null,
      channel: "email",
      direction: "outbound",
      body: `${subject}\n\n${html.replace(/<[^>]+>/g, "")}`,
    });
  }
}
