import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { checkInBooking, updateJobStatus } from "@/app/actions/jobs";

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
  promised_at: string | null;
  customers: { first_name: string | null; last_name: string | null } | null;
  vehicles: { rego: string | null; make: string | null; model: string | null } | null;
  bays: { name: string } | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  checked_in: "Checked in",
  inspecting: "Inspecting",
  awaiting_approval: "Awaiting approval",
  on_lift: "On the lift",
  waiting_on_parts: "Waiting on parts",
  road_test: "Road test",
  ready: "Ready for pickup",
  paid: "Paid",
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
        "id, status, promised_at, customers(first_name, last_name), vehicles(rego, make, model), bays(name), profiles(first_name, last_name)",
      )
      .not("status", "in", "(ready,paid,cancelled)")
      .order("promised_at")
      .returns<JobRow[]>(),
    supabase.from("profiles").select("id, first_name, last_name").eq("role", "technician"),
  ]);

  const notYetCheckedIn = (bookings ?? []).filter((b) => !b.jobs || b.jobs.length === 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Diary</h1>
        <div className="flex gap-4">
          <Link href="/admin/inbox" className="text-sm underline">
            Inbox
          </Link>
          <Link href="/admin/customers" className="text-sm underline">
            Customers
          </Link>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
        Upcoming bookings
      </h2>
      <div className="mb-8 flex flex-col gap-2">
        {notYetCheckedIn.length === 0 ? (
          <p className="text-gray-600">Nothing waiting to be checked in.</p>
        ) : (
          notYetCheckedIn.map((b) => (
            <div key={b.id} className="rounded border px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">
                  {new Date(b.drop_off_at).toLocaleString([], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="mb-2 text-sm text-gray-700">
                {b.customers?.first_name} {b.customers?.last_name} —{" "}
                {b.vehicles?.make} {b.vehicles?.model} ({b.vehicles?.rego})
              </div>
              {technicians && technicians.length > 0 ? (
                <form action={checkInBooking} className="flex gap-2">
                  <input type="hidden" name="booking_id" value={b.id} />
                  <select
                    name="technician_id"
                    required
                    className="rounded border px-2 py-1 text-sm"
                  >
                    <option value="">Assign technician...</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
                    Check in
                  </button>
                </form>
              ) : (
                <p className="text-sm text-gray-500">
                  No technicians yet — add one to enable check-in.
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Active jobs</h2>
      <div className="flex flex-col gap-2">
        {!jobs || jobs.length === 0 ? (
          <p className="text-gray-600">No active jobs right now.</p>
        ) : (
          jobs.map((j) => (
            <div key={j.id} className="rounded border px-4 py-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {j.customers?.first_name} {j.customers?.last_name} —{" "}
                  {j.vehicles?.make} {j.vehicles?.model} ({j.vehicles?.rego})
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">
                  {STATUS_LABELS[j.status] ?? j.status}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {j.bays?.name ?? "No bay"} · Tech: {j.profiles?.first_name}{" "}
                {j.profiles?.last_name}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
