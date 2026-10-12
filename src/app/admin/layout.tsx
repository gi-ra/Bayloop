import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
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

  return (
    <div>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Bayloop — Admin</span>
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
