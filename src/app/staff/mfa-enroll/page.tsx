import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding, toPreLoginBranding } from "@/lib/branding";
import { MfaEnrollForm } from "./mfa-enroll-form";

export default async function MfaEnrollPage() {
  const supabase = await createClient();
  const branding = toPreLoginBranding(await getWorkshopBranding(supabase));

  return <MfaEnrollForm branding={branding} />;
}
