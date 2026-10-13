import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { AuthLogo } from "@/components/auth-card";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: services }, branding] = await Promise.all([
    supabase.from("services").select("id, name, price_min, price_max").order("name"),
    getWorkshopBranding(supabase),
  ]);

  return (
    <main
      className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12"
      style={{ ["--brand" as string]: branding.brandColor }}
    >
      <div className="text-center">
        <AuthLogo logoUrl={branding.logoUrl} brandColor={branding.brandColor} />
        <h1 className="text-2xl font-semibold">{branding.name}</h1>
      </div>

      <Link
        href="/book"
        className="rounded-full bg-[var(--brand)] px-4 py-3 text-center font-semibold text-white"
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
