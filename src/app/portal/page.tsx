import { createClient } from "@/lib/supabase/server";

export default async function PortalHomePage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, rego, make, model, year");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">My vehicles</h1>
      {!vehicles || vehicles.length === 0 ? (
        <p className="text-gray-600">No vehicles on file yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {vehicles.map((v) => (
            <li key={v.id} className="rounded border px-3 py-2">
              {v.year} {v.make} {v.model} — {v.rego}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
