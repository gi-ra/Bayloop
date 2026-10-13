import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { CustomerLoginForm } from "./customer-login-form";

export default async function CustomerLoginPage() {
  const supabase = await createClient();
  const branding = await getWorkshopBranding(supabase);

  return <CustomerLoginForm branding={branding} />;
}
