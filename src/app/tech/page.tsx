import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateJobStatus } from "@/app/actions/jobs";
import { PushSubscribeButton } from "@/components/push-subscribe-button";

type JobRow = {
  id: string;
  status: string;
  promised_at: string | null;
  customer_notes: string | null;
  customers: { first_name: string | null; last_name: string | null } | null;
  vehicles: { rego: string | null; make: string | null; model: string | null } | null;
  bays: { name: string } | null;
};

const NEXT_STATUS_BUTTONS: Record<string, { label: string; status: string }[]> = {
  checked_in: [{ label: "Start job", status: "on_lift" }],
  on_lift: [
    { label: "Waiting on parts", status: "waiting_on_parts" },
    { label: "Road test", status: "road_test" },
    { label: "Done", status: "ready" },
  ],
  waiting_on_parts: [{ label: "Back on the lift", status: "on_lift" }],
  road_test: [{ label: "Done", status: "ready" }],
};

const STATUS_COLORS: Record<string, string> = {
  checked_in: "bg-blue-100 text-blue-700",
  on_lift: "bg-teal-100 text-teal-700",
  waiting_on_parts: "bg-orange-100 text-orange-700",
  road_test: "bg-indigo-100 text-indigo-700",
};

export default async function TechHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("jobs")
    .select(
      "id, status, promised_at, customer_notes, customers(first_name, last_name), vehicles(rego, make, model), bays(name)",
    )
    .eq("assigned_tech_id", user?.id)
    .not("status", "in", "(ready,paid,cancelled)")
    .order("promised_at")
    .returns<JobRow[]>();

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-5 text-2xl font-bold text-gray-900">Run sheet</h1>

      <PushSubscribeButton />

      {!jobs || jobs.length === 0 ? (
        <p className="rounded-xl border bg-white px-5 py-8 text-center text-gray-500 shadow-sm">
          No jobs assigned right now.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {job.vehicles?.make} {job.vehicles?.model} ({job.vehicles?.rego})
                  </div>
                  <div className="text-sm text-gray-600">
                    {job.customers?.first_name} {job.customers?.last_name} ·{" "}
                    {job.bays?.name ?? "No bay"}
                  </div>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[job.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {job.status.replaceAll("_", " ")}
                </span>
              </div>

              {job.promised_at && (
                <div className="mb-1 text-sm text-gray-500">
                  Promised:{" "}
                  {new Date(job.promised_at).toLocaleString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              )}
              {job.customer_notes && (
                <div className="mb-3 text-sm italic text-gray-500">
                  &quot;{job.customer_notes}&quot;
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {(NEXT_STATUS_BUTTONS[job.status] ?? []).map((btn) => (
                  <form key={btn.status} action={updateJobStatus}>
                    <input type="hidden" name="job_id" value={job.id} />
                    <input type="hidden" name="status" value={btn.status} />
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--brand)] px-5 py-3 text-base font-semibold text-white"
                    >
                      {btn.label}
                    </button>
                  </form>
                ))}
                <Link
                  href={`/tech/jobs/${job.id}`}
                  className="rounded-full border border-gray-300 px-5 py-3 text-base font-semibold text-gray-700"
                >
                  Inspection
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
