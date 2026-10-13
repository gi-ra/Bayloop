import { SignOutButton } from "@/components/sign-out-button";
import type { WorkshopBranding } from "@/lib/branding";

export function DashboardHeader({
  branding,
  label,
}: {
  branding: WorkshopBranding;
  label?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt="" className="h-7 max-w-[120px] object-contain" />
        ) : (
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: branding.brandColor }}
            aria-hidden="true"
          />
        )}
        <span className="font-semibold">
          {branding.name}
          {label && ` — ${label}`}
        </span>
      </div>
      <SignOutButton />
    </header>
  );
}
