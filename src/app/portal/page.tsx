import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type JobRow = {
  id: string;
  status: string;
  vehicles: { rego: string | null; make: string | null; model: string | null } | null;
};

export default async function PortalHomePage() {
  const supabase = await createClient();
  const [{ data: vehicles }, { data: jobs }] = await Promise.all([
    supabase.from("vehicles").select("id, rego, make, model, year"),
    supabase
      .from("jobs")
      .select("id, status, vehicles(rego, make, model)")
      .order("created_at", { ascending: false })
      .returns<JobRow[]>(),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      {jobs && jobs.length > 0 && (
        <>
          <h1 className="mb-4 text-xl font-semibold">My jobs</h1>
          <ul className="mb-8 flex flex-col gap-2">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  href={`/portal/jobs/${j.id}`}
                  className="block rounded border px-3 py-2 hover:bg-gray-50"
                >
                  <div>
                    {j.vehicles?.make} {j.vehicles?.model} ({j.vehicles?.rego})
                  </div>
                  <div className="text-sm text-gray-500">{j.status.replaceAll("_", " ")}</div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

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
