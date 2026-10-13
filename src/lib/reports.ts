import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type JobProfitRow = {
  jobId: string;
  vehicle: string;
  customer: string;
  quotedTotal: number;
  actualPartsCost: number;
  actualHours: number;
};

export async function getJobProfitRows(
  supabase: SupabaseServerClient,
  workshopId: string,
): Promise<JobProfitRow[]> {
  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, customers(first_name, last_name), vehicles(make, model, rego)",
    )
    .eq("workshop_id", workshopId)
    .in("status", ["ready", "paid"]);

  if (!jobs || jobs.length === 0) return [];

  const rows: JobProfitRow[] = [];

  for (const job of jobs) {
    const customer = job.customers as unknown as {
      first_name: string | null;
      last_name: string | null;
    } | null;
    const vehicle = job.vehicles as unknown as {
      make: string | null;
      model: string | null;
      rego: string | null;
    } | null;

    const { data: quote } = await supabase
      .from("quotes")
      .select("id")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let quotedTotal = 0;
    if (quote) {
      const { data: lines } = await supabase
        .from("quote_lines")
        .select("qty, unit_price")
        .eq("quote_id", quote.id)
        .eq("approved", true);
      quotedTotal = (lines ?? []).reduce((sum, l) => sum + l.qty * l.unit_price, 0);
    }

    const { data: partsRequests } = await supabase
      .from("parts_requests")
      .select("id")
      .eq("job_id", job.id);
    let actualPartsCost = 0;
    if (partsRequests && partsRequests.length > 0) {
      const { data: orders } = await supabase
        .from("purchase_orders")
        .select("cost")
        .in(
          "parts_request_id",
          partsRequests.map((p) => p.id),
        );
      actualPartsCost = (orders ?? []).reduce((sum, o) => sum + (o.cost ?? 0), 0);
    }

    const { data: entries } = await supabase
      .from("time_entries")
      .select("started_at, stopped_at")
      .eq("job_id", job.id)
      .not("stopped_at", "is", null);
    const actualHours =
      (entries ?? []).reduce((sum, e) => {
        const ms = new Date(e.stopped_at!).getTime() - new Date(e.started_at).getTime();
        return sum + ms / (1000 * 60 * 60);
      }, 0) || 0;

    rows.push({
      jobId: job.id,
      vehicle: `${vehicle?.make ?? ""} ${vehicle?.model ?? ""} (${vehicle?.rego ?? ""})`.trim(),
      customer: `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim(),
      quotedTotal,
      actualPartsCost,
      actualHours: Math.round(actualHours * 100) / 100,
    });
  }

  return rows;
}
