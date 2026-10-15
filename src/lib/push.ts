import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails("mailto:support@bayloop.app", publicKey, privateKey);
}

// Sends a browser push notification to every device a staff member has
// subscribed on. Silently does nothing if VAPID keys aren't set yet, or
// if the person has no active subscriptions (e.g. never opted in).
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  if (!publicKey || !privateKey) {
    console.log(`[push stub — no VAPID keys set] to=${userId}: ${payload.title}`);
    return;
  }

  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        // 404/410 means the browser unsubscribed or the subscription
        // expired — clean it up so we stop wasting requests on it.
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Push send failed:", err);
        }
      }
    }),
  );
}

// Finds the technician (or owner/admin) currently assigned to a job and
// pushes a notification to them. Used when a customer sends a new
// message so the person actually working on the car gets pinged.
export async function notifyAssignedTechOfMessage(jobId: string, messageBody: string) {
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("assigned_tech_id, vehicles(rego)")
    .eq("id", jobId)
    .maybeSingle();

  if (!job?.assigned_tech_id) return;

  const vehicle = Array.isArray(job.vehicles) ? job.vehicles[0] : job.vehicles;
  const rego = (vehicle as { rego: string | null } | null)?.rego;
  await sendPushToUser(job.assigned_tech_id, {
    title: rego ? `New message — ${rego}` : "New message",
    body: messageBody.slice(0, 120),
    url: "/tech",
  });
}
