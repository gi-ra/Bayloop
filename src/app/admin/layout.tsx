import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { DashboardHeader } from "@/components/dashboard-header";

const ALLOWED_ROLES = ["admin", "owner"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isTwoFactorVerified } = await getSessionProfile();

  if (!user) {
    redirect("/staff/login");
  }
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect(profile?.role === "technician" ? "/tech" : "/portal");
  }
  if (!isTwoFactorVerified) {
    redirect("/staff/login");
  }

  const supabase = await createClient();
  const branding = await getWorkshopBranding(supabase);

  return (
    <div>
      <DashboardHeader branding={branding} label="Admin" />
      {children}
    </div>
  );
}
