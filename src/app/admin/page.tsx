import { createClient } from "@/lib/supabase/server";
import { checkInBooking } from "@/app/actions/jobs";
import { JobsTable } from "@/components/jobs-table";

type BookingRow = {
  id: string;
  drop_off_at: string;
  status: string;
  customers: { first_name: string | null; last_name: string | null } | null;
  vehicles: { rego: string | null; make: string | null; model: string | null } | null;
  jobs: { id: string }[];
};

type JobRow = {
  id: string;
  status: string;
  customers: { first_name: string | null; last_name: string | null } | null;
  vehicles: { rego: string | null; make: string | null; model: string | null } | null;
  bays: { name: string } | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
};

export default async function AdminHomePage() {
  const supabase = await createClient();

  const [{ data: bookings }, { data: jobs }, { data: technicians }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, drop_off_at, status, customers(first_name, last_name), vehicles(rego, make, model), jobs(id)",
      )
      .neq("status", "cancelled")
      .order("drop_off_at")
      .returns<BookingRow[]>(),
    supabase
      .from("jobs")
      .select(
        "id, status, customers(first_name, last_name), vehicles(rego, make, model), bays(name), profiles(first_name, last_name)",
      )
      .not("status", "in", "(ready,paid,cancelled)")
      .order("promised_at")
      .returns<JobRow[]>(),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .in("role", ["technician", "admin", "owner"]),
  ]);

  const notYetCheckedIn = (bookings ?? []).filter((b) => !b.jobs || b.jobs.length === 0);
  const currentlyWorking = (jobs ?? []).filter((j) => ["on_lift", "road_test"].includes(j.status));

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Diary</h1>

      <div className="mb-8 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Working right now</h2>
        </div>
        {currentlyWorking.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            No one&apos;s actively on a job right now.
          </p>
        ) : (
          <div className="divide-y">
            {currentlyWorking.map((j) => (
              <div key={j.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <span className="font-medium text-gray-900">
                    {j.profiles?.first_name} {j.profiles?.last_name}
                  </span>
                  <span className="text-gray-500">
                    — {j.vehicles?.make} {j.vehicles?.model} ({j.vehicles?.rego})
                  </span>
                </div>
                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-700">
                  {j.status === "on_lift" ? "On the lift" : "Road test"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Upcoming bookings</h2>
        </div>
        {notYetCheckedIn.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nothing waiting to be checked in.
          </p>
        ) : (
          <div className="divide-y">
            {notYetCheckedIn.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(b.drop_off_at).toLocaleString([], {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {b.customers?.first_name} {b.customers?.last_name} —{" "}
                    {b.vehicles?.make} {b.vehicles?.model} ({b.vehicles?.rego})
                  </div>
                </div>
                {technicians && technicians.length > 0 ? (
                  <form action={checkInBooking} className="flex gap-2">
                    <input type="hidden" name="booking_id" value={b.id} />
                    <select
                      name="technician_id"
                      required
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm"
                    >
                      <option value="">Assign technician...</option>
                      {technicians.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.first_name} {t.last_name}
                          {t.role !== "technician" && ` (${t.role})`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Check in
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-gray-500">No technicians yet.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <JobsTable jobs={jobs ?? []} />
    </main>
  );
}
