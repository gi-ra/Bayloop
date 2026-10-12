import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ClickSend posts incoming SMS replies here. Protected by a shared
// secret in the URL (set this same value in both Render's env vars
// and ClickSend's inbound webhook URL) so randoms on the internet
// can't inject fake messages.
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CLICKSEND_INBOUND_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let from: string | null = null;
  let body: string | null = null;

  if (contentType.includes("application/json")) {
    const json = await request.json();
    from = json.from ?? json.originalsenderid ?? null;
    body = json.message ?? json.body ?? null;
  } else {
    const form = await request.formData();
    from = (form.get("from") as string) ?? (form.get("originalsenderid") as string) ?? null;
    body = (form.get("message") as string) ?? (form.get("body") as string) ?? null;
  }

  if (!from || !body) {
    return NextResponse.json({ error: "Missing from/message" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from("customers")
    .select("id, workshop_id")
    .eq("phone", from)
    .limit(1)
    .single();

  // Single-workshop deployment for now, so an unrecognised number still
  // has somewhere to land. Once there's more than one workshop, this
  // needs per-workshop phone numbers to route correctly instead.
  let workshopId = customer?.workshop_id;
  if (!workshopId) {
    const { data: workshop } = await admin.from("workshops").select("id").limit(1).single();
    workshopId = workshop?.id;
  }
  if (!workshopId) {
    return NextResponse.json({ error: "No workshop configured" }, { status: 500 });
  }

  await admin.from("messages").insert({
    workshop_id: workshopId,
    customer_id: customer?.id ?? null,
    channel: "sms",
    direction: "inbound",
    body,
  });

  return NextResponse.json({ ok: true });
}
