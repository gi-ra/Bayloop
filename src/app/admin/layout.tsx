import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SignOutButton } from "@/components/sign-out-button";

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
    <div
      className="flex min-h-screen"
      style={{ ["--brand" as string]: branding.brandColor }}
    >
      <AdminSidebar logoUrl={branding.logoUrl} name={branding.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b bg-white px-6 py-3">
          <SignOutButton />
        </header>
        <div className="flex-1 bg-[#F7F8FA]">{children}</div>
      </div>
    </div>
  );
}
