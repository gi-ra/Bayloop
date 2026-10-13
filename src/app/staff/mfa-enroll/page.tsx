import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { MfaEnrollForm } from "./mfa-enroll-form";

export default async function MfaEnrollPage() {
  const supabase = await createClient();
  const branding = await getWorkshopBranding(supabase);

  return <MfaEnrollForm branding={branding} />;
}
