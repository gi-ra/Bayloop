import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getSessionProfile();

  if (!user) {
    redirect("/portal/login");
  }
  if (profile?.role !== "customer") {
    redirect("/staff");
  }

  const supabase = await createClient();
  const branding = await getWorkshopBranding(supabase);

  return (
    <div>
      <DashboardHeader branding={branding} />
      {children}
    </div>
  );
}
