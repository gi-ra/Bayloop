import { createClient } from "@/lib/supabase/server";
import { connectStripe, refreshStripeStatus } from "@/app/actions/stripe-connect";
import { updateBrandColor, updateStaffTheme } from "@/app/actions/branding";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("workshop_id")
    .eq("id", user?.id ?? "")
    .single();
  const { data: workshop } = await supabase
    .from("workshops")
    .select("name, stripe_account_id, stripe_onboarding_complete, brand_color, logo_url, staff_theme")
    .eq("id", profile?.workshop_id ?? "")
    .single();

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold text-gray-900">Online payments (Stripe)</h2>
        {workshop?.stripe_onboarding_complete ? (
          <p className="text-sm font-medium text-green-700">
            ✓ Connected — customers can pay invoices online.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">
              {workshop?.stripe_account_id
                ? "Stripe setup started but not finished yet."
                : "Not connected yet — customers can't pay invoices online until this is done."}
            </p>
            <form action={connectStripe}>
              <button
                type="submit"
                className="self-start rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
              >
                {workshop?.stripe_account_id ? "Finish connecting Stripe" : "Connect Stripe"}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold text-gray-900">Branding</h2>
        <p className="mb-4 text-sm text-gray-600">
          Controls the look of your public pages: homepage, booking, customer login, and the
          live tracker link customers get texted.
        </p>

        <form action={updateBrandColor} className="mb-5 flex items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Brand color</label>
            <input
              name="brand_color"
              type="color"
              defaultValue={workshop?.brand_color ?? "#2F7A73"}
              className="h-10 w-20 rounded-lg border border-gray-200"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
          >
            Save color
          </button>
        </form>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Logo</label>
          <LogoUpload
            workshopId={profile?.workshop_id ?? ""}
            currentLogoUrl={workshop?.logo_url ?? null}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold text-gray-900">Staff login theme</h2>
        <p className="mb-4 text-sm text-gray-600">
          Light or dark look for the staff login and two-factor setup pages (customer-facing
          pages always stay light/branded).
        </p>
        <form action={updateStaffTheme} className="flex items-center gap-3">
          <select
            name="staff_theme"
            defaultValue={workshop?.staff_theme ?? "light"}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
          >
            Save
          </button>
        </form>
      </div>
    </main>
  );
}
