import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";
import { TrackerMessageForm } from "@/components/tracker-message-form";

const STATUS_STEPS = [
  { key: "checked_in", label: "Checked in" },
  { key: "on_lift", label: "On the lift" },
  { key: "waiting_on_parts", label: "Waiting on parts" },
  { key: "road_test", label: "Road test" },
  { key: "ready", label: "Ready for pickup" },
];

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const [{ data, error }, branding] = await Promise.all([
    supabase.rpc("get_job_by_tracker_token", { p_token: token }).single(),
    getWorkshopBranding(supabase),
  ]);

  if (error || !data) notFound();

  const job = data as {
    status: string;
    promised_at: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_rego: string | null;
    service_name: string | null;
  };

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === job.status);

  return (
    <main
      className="mx-auto max-w-sm px-4 py-10"
      style={{ ["--brand" as string]: branding.brandColor }}
    >
      <h1 className="mb-1 text-xl font-semibold">
        {job.vehicle_make} {job.vehicle_model}
        {job.vehicle_rego && ` (${job.vehicle_rego})`}
      </h1>
      {job.service_name && <p className="mb-6 text-gray-600">{job.service_name}</p>}

      <div className="flex flex-col gap-3">
        {STATUS_STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                i <= currentIndex ? "bg-[var(--brand)]" : "bg-gray-200"
              }`}
            />
            <span className={i <= currentIndex ? "font-medium" : "text-gray-400"}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {job.promised_at && (
        <p className="mt-6 text-sm text-gray-500">
          Promised by{" "}
          {new Date(job.promised_at).toLocaleString([], {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}

      <TrackerMessageForm token={token} />
    </main>
  );
}
