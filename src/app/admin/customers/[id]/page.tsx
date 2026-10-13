import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createVehicle } from "../actions";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, email")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, rego, make, model")
    .eq("customer_id", id)
    .order("rego");

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/admin/customers" className="text-sm font-medium text-[var(--brand)] hover:underline">
        ← Back to customers
      </Link>

      <h1 className="mb-1 mt-3 text-2xl font-bold text-gray-900">
        {customer.first_name} {customer.last_name}
      </h1>
      <p className="mb-6 text-gray-600">
        {customer.phone}
        {customer.email && ` · ${customer.email}`}
      </p>

      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Vehicles</h2>
        </div>
        {!vehicles || vehicles.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No vehicles on file.</p>
        ) : (
          <div className="divide-y">
            {vehicles.map((v) => (
              <div key={v.id} className="px-5 py-3 text-sm">
                <span className="font-medium text-gray-900">
                  {v.make} {v.model}
                </span>
                <span className="text-gray-500"> — {v.rego}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-md rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Add a vehicle</h2>
        <form action={createVehicle} className="flex flex-col gap-3">
          <input type="hidden" name="customer_id" value={customer.id} />
          <input
            name="rego"
            placeholder="Rego"
            required
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="make"
              placeholder="Make"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
            <input
              name="model"
              placeholder="Model"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
          >
            Add vehicle
          </button>
        </form>
      </div>
    </main>
  );
}
