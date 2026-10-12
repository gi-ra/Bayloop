import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Full-access client that bypasses every security rule.
 *
 * Only ever used in test setup code that runs on a developer's machine —
 * never in a page, component, or anything that runs in the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
