import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { DashboardHeader } from "@/components/dashboard-header";

const ALLOWED_ROLES = ["technician", "admin", "owner"];

export default async function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isTwoFactorVerified } = await getSessionProfile();

  if (!user) {
    redirect("/staff/login");
  }
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect("/portal");
  }
  if (!isTwoFactorVerified) {
    redirect("/staff/login");
  }

  const supabase = await createClient();
  const branding = await getWorkshopBranding(supabase);

  return (
    <div
      className="min-h-screen bg-[#F7F8FA]"
      style={{ ["--brand" as string]: branding.brandColor }}
    >
      <DashboardHeader branding={branding} label="Technician" />
      {children}
    </div>
  );
}
