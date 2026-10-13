import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getJobProfitRows } from "@/lib/reports";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("workshop_id, role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "owner"].includes(profile.role)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const rows = await getJobProfitRows(supabase, profile.workshop_id as string);

  const header = "Vehicle,Customer,Quoted total,Actual parts cost,Actual tech hours";
  const csvRows = rows.map((r) =>
    [r.vehicle, r.customer, r.quotedTotal.toFixed(2), r.actualPartsCost.toFixed(2), r.actualHours]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [header, ...csvRows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=job-profit.csv",
    },
  });
}
