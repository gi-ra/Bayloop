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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/customers" className="text-sm underline">
        Back to customers
      </Link>

      <h1 className="mb-1 mt-2 text-xl font-semibold">
        {customer.first_name} {customer.last_name}
      </h1>
      <p className="mb-6 text-gray-600">
        {customer.phone}
        {customer.email && ` · ${customer.email}`}
      </p>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
        Vehicles
      </h2>
      <div className="mb-6 flex flex-col gap-2">
        {!vehicles || vehicles.length === 0 ? (
          <p className="text-gray-600">No vehicles on file.</p>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="rounded border px-4 py-2">
              {v.make} {v.model} — {v.rego}
            </div>
          ))
        )}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
        Add a vehicle
      </h2>
      <form action={createVehicle} className="flex flex-col gap-3">
        <input type="hidden" name="customer_id" value={customer.id} />
        <input name="rego" placeholder="Rego" required className="rounded border px-3 py-2" />
        <div className="grid grid-cols-2 gap-3">
          <input name="make" placeholder="Make" className="rounded border px-3 py-2" />
          <input name="model" placeholder="Model" className="rounded border px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Add vehicle
        </button>
      </form>
    </main>
  );
}
