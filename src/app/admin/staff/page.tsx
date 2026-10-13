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
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Staff</h1>

      <div className="mb-8 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Team</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-2.5 font-medium">Name</th>
                <th className="px-5 py-2.5 font-medium">Role</th>
                <th className="px-5 py-2.5 font-medium">Two-factor</th>
                <th className="px-5 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {staffWithMfaStatus.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">
                      {s.first_name} {s.last_name}
                    </div>
                    <div className="text-xs text-gray-500">{s.email}</div>
                  </td>
                  <td className="px-5 py-3 capitalize text-gray-600">{s.role}</td>
                  <td className="px-5 py-3">
                    {s.hasMfa ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                        Enabled
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Not set up
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {s.hasMfa && s.role !== "owner" && (
                      <form action={resetStaffTwoFactor}>
                        <input type="hidden" name="user_id" value={s.id} />
                        <button
                          type="submit"
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                        >
                          Reset two-factor
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="max-w-md rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold text-gray-900">Add a staff member</h2>
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
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="Temporary password"
            required
            minLength={8}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />
          <select
            name="role"
            required
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          >
            <option value="technician">Technician</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="self-start rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
          >
            Create account
          </button>
        </form>
      </div>
    </main>
  );
}
