import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type BookingRow = {
  id: string;
  drop_off_at: string;
  pickup_at: string;
  status: string;
  customers: { first_name: string | null; last_name: string | null; phone: string | null } | null;
  vehicles: { rego: string | null; make: string | null; model: string | null } | null;
  services: { name: string } | null;
  bays: { name: string } | null;
};

export default async function AdminHomePage() {
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, drop_off_at, pickup_at, status, customers(first_name, last_name, phone), vehicles(rego, make, model), services(name), bays(name)",
    )
    .order("drop_off_at")
    .returns<BookingRow[]>();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Diary</h1>
        <Link href="/admin/customers" className="text-sm underline">
          Customers
        </Link>
      </div>

      {!bookings || bookings.length === 0 ? (
        <p className="text-gray-600">No bookings yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map((b) => (
            <div key={b.id} className="rounded border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {new Date(b.drop_off_at).toLocaleString([], {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-600">
                  {b.status}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                {b.customers?.first_name} {b.customers?.last_name} —{" "}
                {b.vehicles?.make} {b.vehicles?.model} ({b.vehicles?.rego})
              </div>
              <div className="text-sm text-gray-500">
                {b.services?.name} · {b.bays?.name ?? "No bay assigned"}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
