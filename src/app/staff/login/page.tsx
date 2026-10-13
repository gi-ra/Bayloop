import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding, toPreLoginBranding } from "@/lib/branding";
import { StaffLoginForm } from "./staff-login-form";

export default async function StaffLoginPage() {
  const supabase = await createClient();
  const branding = toPreLoginBranding(await getWorkshopBranding(supabase));

  return <StaffLoginForm branding={branding} />;
}
