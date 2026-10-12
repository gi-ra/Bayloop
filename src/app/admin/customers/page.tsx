import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCustomer } from "./actions";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .order("first_name");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <Link href="/admin" className="text-sm underline">
          Diary
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-2">
        {!customers || customers.length === 0 ? (
          <p className="text-gray-600">No customers yet.</p>
        ) : (
          customers.map((c) => (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className="rounded border px-4 py-2 hover:bg-gray-50"
            >
              {c.first_name} {c.last_name} — {c.phone}
            </Link>
          ))
        )}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
        Add a customer
      </h2>
      <form action={createCustomer} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            name="first_name"
            placeholder="First name"
            required
            className="rounded border px-3 py-2"
          />
          <input
            name="last_name"
            placeholder="Last name"
            required
            className="rounded border px-3 py-2"
          />
        </div>
        <input
          name="phone"
          type="tel"
          placeholder="Mobile number"
          required
          className="rounded border px-3 py-2"
        />
        <input
          name="email"
          type="email"
          placeholder="Email (optional)"
          className="rounded border px-3 py-2"
        />
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Add customer
        </button>
      </form>
    </main>
  );
}
