import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateJobStatus } from "@/app/actions/jobs";

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
      <h1 className="mb-4 text-xl font-semibold">My jobs today</h1>

      {!jobs || jobs.length === 0 ? (
        <p className="text-gray-600">No jobs assigned right now.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded border p-4">
              <div className="mb-1 text-lg font-medium">
                {job.vehicles?.make} {job.vehicles?.model} ({job.vehicles?.rego})
              </div>
              <div className="mb-1 text-sm text-gray-600">
                {job.customers?.first_name} {job.customers?.last_name} ·{" "}
                {job.bays?.name ?? "No bay"}
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
                <div className="mb-2 text-sm italic text-gray-500">
                  &quot;{job.customer_notes}&quot;
                </div>
              )}

              <div className="mb-2 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">
                {job.status.replaceAll("_", " ")}
              </div>

              <div className="flex flex-wrap gap-2">
                {(NEXT_STATUS_BUTTONS[job.status] ?? []).map((btn) => (
                  <form key={btn.status} action={updateJobStatus}>
                    <input type="hidden" name="job_id" value={job.id} />
                    <input type="hidden" name="status" value={btn.status} />
                    <button
                      type="submit"
                      className="rounded bg-black px-4 py-3 text-base font-medium text-white"
                    >
                      {btn.label}
                    </button>
                  </form>
                ))}
                <Link
                  href={`/tech/jobs/${job.id}`}
                  className="rounded border px-4 py-3 text-base font-medium"
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
