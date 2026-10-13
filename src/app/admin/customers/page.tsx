import { createClient } from "@/lib/supabase/server";
import { createCustomer } from "./actions";
import { CustomersTable } from "@/components/customers-table";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .order("first_name");

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Customers</h1>

      <div className="mb-8">
        <CustomersTable customers={customers ?? []} />
      </div>

      <div className="max-w-md rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Add a customer</h2>
        <form action={createCustomer} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="first_name"
              placeholder="First name"
              required
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
            <input
              name="last_name"
              placeholder="Last name"
              required
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <input
            name="phone"
            type="tel"
            placeholder="Mobile number"
            required
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Email (optional)"
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
          >
            Add customer
          </button>
        </form>
      </div>
    </main>
  );
}
