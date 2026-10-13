import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStaffAccount, resetStaffTwoFactor } from "@/app/actions/staff";

export default async function StaffPage() {
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, role")
    .in("role", ["technician", "admin", "owner"])
    .order("role");

  const admin = createAdminClient();
  const staffWithMfaStatus = await Promise.all(
    (staff ?? []).map(async (s) => {
      const { data: factors } = await admin.auth.admin.mfa.listFactors({ userId: s.id });
      const hasMfa = (factors?.factors ?? []).some((f) => f.status === "verified");
      return { ...s, hasMfa };
    }),
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Staff</h1>

      <div className="mb-8 flex flex-col gap-2">
        {staffWithMfaStatus.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded border px-4 py-3">
            <div>
              <div className="font-medium">
                {s.first_name} {s.last_name} ({s.email})
              </div>
              <div className="text-sm text-gray-500">
                {s.role} ·{" "}
                {s.hasMfa ? (
                  <span className="text-green-700">two-factor enabled</span>
                ) : (
                  <span className="text-amber-600">two-factor not set up</span>
                )}
              </div>
            </div>
            {s.hasMfa && s.role !== "owner" && (
              <form action={resetStaffTwoFactor}>
                <input type="hidden" name="user_id" value={s.id} />
                <button type="submit" className="rounded border px-3 py-1 text-sm">
                  Reset two-factor
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Add a staff member</h2>
      <p className="mb-3 text-sm text-gray-600">
        They&apos;ll log in with this email and password, then set up their own two-factor
        authenticator on first login.
      </p>
      <form action={createStaffAccount} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            name="first_name"
            placeholder="First name"
            required
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            name="last_name"
            placeholder="Last name"
            required
            className="rounded border px-3 py-2 text-sm"
          />
        </div>
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border px-3 py-2 text-sm"
        />
        <input
          name="password"
          type="password"
          placeholder="Temporary password"
          required
          minLength={8}
          className="rounded border px-3 py-2 text-sm"
        />
        <select name="role" required className="rounded border px-3 py-2 text-sm">
          <option value="technician">Technician</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="self-start rounded bg-black px-4 py-2 text-white">
          Create account
        </button>
      </form>
    </main>
  );
}
