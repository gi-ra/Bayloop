import { createAdminClient } from "@/lib/supabase/admin";

type LogContext = { workshopId: string; customerId?: string | null };

// Sends an SMS via ClickSend and logs it to the inbox. If credentials
// aren't configured yet (e.g. still in early development), it logs to
// the console instead of sending — so the rest of the app keeps working
// without a live account.
export async function sendSms(to: string, body: string, log?: LogContext) {
  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;

  if (!username || !apiKey) {
    console.log(`[sms stub — no ClickSend credentials set] to=${to}: ${body}`);
  } else {
    const auth = Buffer.from(`${username}:${apiKey}`).toString("base64");

    const response = await fetch("https://rest.clicksend.com/v3/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ to, body, source: "bayloop" }],
      }),
    });

    if (!response.ok) {
      console.error(`ClickSend SMS failed (${response.status}):`, await response.text());
    }
  }

  if (log) {
    const admin = createAdminClient();
    await admin.from("messages").insert({
      workshop_id: log.workshopId,
      customer_id: log.customerId ?? null,
      channel: "sms",
      direction: "outbound",
      body,
    });
  }
}
