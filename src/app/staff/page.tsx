import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { createClient } from "@/lib/supabase/server";

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

  // Admin/owner: if they've actually got an active job assigned to them
  // (an owner who also works on cars), take them straight to the run
  // sheet instead of assuming they only ever want the admin dashboard.
  const supabase = await createClient();
  const { data: activeJob } = await supabase
    .from("jobs")
    .select("id")
    .eq("assigned_tech_id", user.id)
    .not("status", "in", "(ready,paid,cancelled)")
    .limit(1)
    .maybeSingle();

  if (activeJob) {
    redirect("/tech");
  }
  redirect("/admin");
}
