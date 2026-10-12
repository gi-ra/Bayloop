import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { SignOutButton } from "@/components/sign-out-button";

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

  return (
    <div>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Boyta Auto Centre</span>
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
