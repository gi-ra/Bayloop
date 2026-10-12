import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

// This page is just a traffic director: log in here, then bounce to the
// right area for your role. It's also where the "are you allowed past
// this point?" check lives for everything under /tech and /admin.
export default async function StaffHomePage() {
  const { user, profile, isTwoFactorVerified } = await getSessionProfile();

  if (!user) {
    redirect("/staff/login");
  }
  if (!profile || !["technician", "admin", "owner"].includes(profile.role)) {
    redirect("/portal");
  }
  if (!isTwoFactorVerified) {
    redirect("/staff/login");
  }

  if (profile.role === "technician") {
    redirect("/tech");
  }
  redirect("/admin");
}
