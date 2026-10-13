import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { AuthCard, authButtonClass, authSecondaryLinkClass } from "@/components/auth-card";

export default async function Home() {
  const supabase = await createClient();
  const branding = await getWorkshopBranding(supabase);

  return (
    <AuthCard title={branding.name} logoUrl={branding.logoUrl} brandColor={branding.brandColor}>
      <div className="flex flex-col gap-3">
        <Link href="/portal/login" className={authButtonClass}>
          Customer login
        </Link>
        <Link href="/staff/login" className={authSecondaryLinkClass()}>
          Staff login
        </Link>
      </div>
    </AuthCard>
  );
}
