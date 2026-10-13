import { createClient } from "@/lib/supabase/server";
import { getJobProfitRows } from "@/lib/reports";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", user?.id ?? "")
    .single();
  const workshopId = profile?.workshop_id as string;

  const jobProfitRows = await getJobProfitRows(supabase, workshopId);

  // Technician hours clocked in the last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentEntries } = await supabase
    .from("time_entries")
    .select("tech_id, started_at, stopped_at, profiles(first_name, last_name)")
    .gte("started_at", weekAgo)
    .not("stopped_at", "is", null);

  const hoursByTech = new Map<string, { name: string; hours: number }>();
  for (const e of recentEntries ?? []) {
    const tech = e.profiles as unknown as { first_name: string | null; last_name: string | null } | null;
    const name = `${tech?.first_name ?? ""} ${tech?.last_name ?? ""}`.trim() || "Unknown";
    const hours = (new Date(e.stopped_at!).getTime() - new Date(e.started_at).getTime()) / 3600000;
    const existing = hoursByTech.get(e.tech_id) ?? { name, hours: 0 };
    existing.hours += hours;
    hoursByTech.set(e.tech_id, existing);
  }

  // Approval rate
  const { data: decidedLines } = await supabase
    .from("quote_lines")
    .select("approved")
    .eq("workshop_id", workshopId)
    .not("approved", "is", null);
  const approvedCount = (decidedLines ?? []).filter((l) => l.approved).length;
  const approvalRate =
    decidedLines && decidedLines.length > 0
      ? Math.round((approvedCount / decidedLines.length) * 100)
      : null;

  // Comeback rate: vehicles with 2+ jobs within 30 days of each other
  const { data: allJobs } = await supabase
    .from("jobs")
    .select("vehicle_id, created_at")
    .eq("workshop_id", workshopId)
    .order("created_at");
  const byVehicle = new Map<string, string[]>();
  for (const j of allJobs ?? []) {
    const list = byVehicle.get(j.vehicle_id) ?? [];
    list.push(j.created_at);
    byVehicle.set(j.vehicle_id, list);
  }
  let comebackCount = 0;
  for (const dates of byVehicle.values()) {
    for (let i = 1; i < dates.length; i++) {
      const gapDays =
        (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 60 * 60 * 24);
      if (gapDays <= 30) comebackCount++;
    }
  }
  const comebackRate =
    allJobs && allJobs.length > 0 ? Math.round((comebackCount / allJobs.length) * 100) : null;

  // Cash position: unpaid invoices
  const { data: unpaidInvoices } = await supabase
    .from("invoices")
    .select("id, total, status, created_at, customers(first_name, last_name)")
    .eq("workshop_id", workshopId)
    .neq("status", "paid")
    .order("created_at");

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Reports</h1>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Approval rate</div>
          <div className="text-3xl font-bold text-gray-900">
            {approvalRate !== null ? `${approvalRate}%` : "—"}
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Comeback rate (30 days)</div>
          <div className="text-3xl font-bold text-gray-900">
            {comebackRate !== null ? `${comebackRate}%` : "—"}
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Job profit</h2>
          <a href="/api/reports/job-profit" className="text-sm font-medium text-[var(--brand)] hover:underline">
            Export CSV
          </a>
        </div>
        {jobProfitRows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No completed jobs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-2.5 font-medium">Vehicle</th>
                  <th className="px-5 py-2.5 font-medium">Customer</th>
                  <th className="px-5 py-2.5 font-medium">Quoted</th>
                  <th className="px-5 py-2.5 font-medium">Parts cost</th>
                  <th className="px-5 py-2.5 font-medium">Tech hours</th>
                </tr>
              </thead>
              <tbody>
                {jobProfitRows.map((r) => (
                  <tr key={r.jobId} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{r.vehicle}</td>
                    <td className="px-5 py-3 text-gray-600">{r.customer}</td>
                    <td className="px-5 py-3 text-gray-600">${r.quotedTotal.toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-600">${r.actualPartsCost.toFixed(2)}</td>
                    <td className="px-5 py-3 text-gray-600">{r.actualHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Technician hours — last 7 days</h2>
        </div>
        {hoursByTech.size === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No clocked time yet.</p>
        ) : (
          <div className="divide-y">
            {Array.from(hoursByTech.values()).map((t) => (
              <div key={t.name} className="flex justify-between px-5 py-3 text-sm">
                <span className="font-medium text-gray-900">{t.name}</span>
                <span className="text-gray-600">{Math.round(t.hours * 10) / 10}h</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Cash position — unpaid invoices</h2>
        </div>
        {!unpaidInvoices || unpaidInvoices.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Nothing outstanding.</p>
        ) : (
          <div className="divide-y">
            {unpaidInvoices.map((inv) => {
              const customer = inv.customers as unknown as {
                first_name: string | null;
                last_name: string | null;
              } | null;
              const ageDays = Math.floor(
                (Date.now() - new Date(inv.created_at).getTime()) / (1000 * 60 * 60 * 24),
              );
              return (
                <div key={inv.id} className="flex justify-between px-5 py-3 text-sm">
                  <span className="font-medium text-gray-900">
                    {customer?.first_name} {customer?.last_name}{" "}
                    <span className="font-normal capitalize text-gray-500">({inv.status})</span>
                  </span>
                  <span className="text-gray-600">
                    ${inv.total.toFixed(2)} · {ageDays}d
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
