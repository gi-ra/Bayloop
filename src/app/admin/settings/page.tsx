import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { connectStripe, refreshStripeStatus } from "@/app/actions/stripe-connect";
import { updateBrandColor } from "@/app/actions/branding";
import { LogoUpload } from "@/components/logo-upload";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe_return?: string }>;
}) {
  const { stripe_return } = await searchParams;
  if (stripe_return) {
    await refreshStripeStatus();
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("workshop_id")
    .single();
  const { data: workshop } = await supabase
    .from("workshops")
    .select("name, stripe_account_id, stripe_onboarding_complete, brand_color, logo_url")
    .eq("id", profile?.workshop_id ?? "")
    .single();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/admin" className="text-sm underline">
        Back to diary
      </Link>

      <h1 className="mb-6 mt-2 text-xl font-semibold">Settings</h1>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
        Online payments (Stripe)
      </h2>
      {workshop?.stripe_onboarding_complete ? (
        <p className="text-green-700">
          ✓ Connected — customers can pay invoices online.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-gray-600">
            {workshop?.stripe_account_id
              ? "Stripe setup started but not finished yet."
              : "Not connected yet — customers can't pay invoices online until this is done."}
          </p>
          <form action={connectStripe}>
            <button type="submit" className="rounded bg-black px-4 py-2 text-white">
              {workshop?.stripe_account_id ? "Finish connecting Stripe" : "Connect Stripe"}
            </button>
          </form>
        </div>
      )}

      <h2 className="mb-2 mt-8 text-sm font-semibold uppercase text-gray-500">Branding</h2>
      <p className="mb-3 text-sm text-gray-600">
        Controls the look of your public pages: homepage, booking, customer login, and the
        live tracker link customers get texted.
      </p>
      <form action={updateBrandColor} className="mb-6 flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Brand color</label>
          <input
            name="brand_color"
            type="color"
            defaultValue={workshop?.brand_color ?? "#2F7A73"}
            className="h-10 w-20 rounded border"
          />
        </div>
        <button type="submit" className="self-start rounded bg-black px-4 py-2 text-white">
          Save color
        </button>
      </form>

      <div>
        <label className="mb-1 block text-sm font-medium">Logo</label>
        <LogoUpload
          workshopId={profile?.workshop_id ?? ""}
          currentLogoUrl={workshop?.logo_url ?? null}
        />
      </div>
    </main>
  );
}
