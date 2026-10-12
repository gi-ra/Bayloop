import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price_min, price_max")
    .order("name");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Boyta Auto Centre</h1>
        <p className="text-gray-600">Bayloop — workshop management system.</p>
      </div>

      <Link
        href="/book"
        className="rounded bg-black px-4 py-3 text-center font-medium text-white"
      >
        Book a service
      </Link>

      {services && services.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Services
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-gray-700">
            {services.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-gray-500">
                  ${s.price_min}–${s.price_max}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t pt-4">
        <Link href="/portal/login" className="rounded border px-3 py-2 text-center">
          Customer login
        </Link>
        <Link href="/staff/login" className="rounded border px-3 py-2 text-center">
          Staff login
        </Link>
      </div>
    </main>
  );
}
