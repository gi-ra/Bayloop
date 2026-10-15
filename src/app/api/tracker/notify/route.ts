import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAssignedTechOfMessage } from "@/lib/push";

// Called right after a customer sends a message from the public live
// tracker page (send_tracker_message RPC). The token is already public
// knowledge to whoever has the tracker link, so looking up its job here
// doesn't expose anything new.
//
// Deliberately does NOT trust a client-supplied message body — anyone
// with the link could otherwise push arbitrary text to a tech's phone
// without it ever being saved/audited. Instead it re-reads the most
// recent inbound message that actually landed in the database.
export async function POST(request: NextRequest) {
  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id, customer_id")
    .eq("tracker_token", token)
    .maybeSingle();

  if (job?.customer_id) {
    const { data: message } = await admin
      .from("messages")
      .select("body, created_at")
      .eq("customer_id", job.customer_id)
      .eq("channel", "web")
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Only notify if that message really was just saved (within the
    // last 30s) — guards against replaying an old message endlessly.
    const isRecent = message && Date.now() - new Date(message.created_at).getTime() < 30_000;
    if (isRecent) {
      await notifyAssignedTechOfMessage(job.id, message.body);
    }
  }

  return NextResponse.json({ ok: true });
}
