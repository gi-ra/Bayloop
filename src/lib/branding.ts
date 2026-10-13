import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type WorkshopBranding = {
  name: string;
  logoUrl: string | null;
  brandColor: string;
};

const DEFAULT_BRANDING: WorkshopBranding = {
  name: "Bayloop",
  logoUrl: null,
  brandColor: "#2F7A73",
};

// Single-workshop deployment for now, so this just grabs the one
// workshop's branding. Once multiple workshops share one deployment,
// this needs to resolve by domain/slug instead of grabbing the first row.
export async function getWorkshopBranding(
  supabase: SupabaseServerClient,
): Promise<WorkshopBranding> {
  const { data } = await supabase
    .from("workshops")
    .select("name, logo_url, brand_color")
    .limit(1)
    .maybeSingle();

  if (!data) return DEFAULT_BRANDING;

  return {
    name: data.name,
    logoUrl: data.logo_url,
    brandColor: data.brand_color,
  };
}
