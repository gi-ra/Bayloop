import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startInspection, updateInspectionItem } from "@/app/actions/inspections";
import { requestPart } from "@/app/actions/parts";
import { PhotoUpload } from "@/components/photo-upload";
import { MediaThumb } from "@/components/media-thumb";

type PartsRequest = {
  id: string;
  description: string;
  status: string;
};

type InspectionItem = {
  id: string;
  label: string;
  rating: string | null;
  notes: string | null;
  measurement: string | null;
  photo_urls: string[];
  sort_order: number;
};

const RATINGS = [
  { value: "good", label: "Good" },
  { value: "monitor", label: "Monitor" },
  { value: "urgent", label: "Urgent" },
];

export default async function TechJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, workshop_id, status, vehicles(rego, make, model)")
    .eq("id", id)
    .single();
  if (!job) notFound();

  const { data: inspection } = await supabase
    .from("inspections")
    .select("id")
    .eq("job_id", id)
    .maybeSingle();

  let items: InspectionItem[] = [];
  if (inspection) {
    const { data } = await supabase
      .from("inspection_items")
      .select("id, label, rating, notes, measurement, photo_urls, sort_order")
      .eq("inspection_id", inspection.id)
      .order("sort_order");
    items = data ?? [];
  }

  const photoSignedUrls: Record<string, string> = {};
  for (const item of items) {
    for (const path of item.photo_urls) {
      const { data } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(path, 3600);
      if (data) photoSignedUrls[path] = data.signedUrl;
    }
  }

  const { data: partsRequests } = await supabase
    .from("parts_requests")
    .select("id, description, status")
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .returns<PartsRequest[]>();

  const vehicle = job.vehicles as unknown as {
    rego: string | null;
    make: string | null;
    model: string | null;
  } | null;

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <Link href="/tech" className="text-sm underline">
        Back to my jobs
      </Link>
      <h1 className="mb-6 mt-2 text-xl font-semibold">
        {vehicle?.make} {vehicle?.model} ({vehicle?.rego})
      </h1>

      {!inspection ? (
        <form action={startInspection}>
          <input type="hidden" name="job_id" value={job.id} />
          <button
            type="submit"
            className="rounded bg-black px-4 py-3 text-base font-medium text-white"
          >
            Start inspection
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded border p-4">
              <div className="mb-2 font-medium">{item.label}</div>

              <form action={updateInspectionItem} className="flex flex-col gap-2">
                <input type="hidden" name="item_id" value={item.id} />
                <input type="hidden" name="job_id" value={job.id} />

                <div className="flex gap-2">
                  {RATINGS.map((r) => (
                    <label
                      key={r.value}
                      className={`cursor-pointer rounded border px-3 py-2 text-sm ${
                        item.rating === r.value ? "bg-black text-white" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="rating"
                        value={r.value}
                        defaultChecked={item.rating === r.value}
                        className="hidden"
                      />
                      {r.label}
                    </label>
                  ))}
                </div>

                <input
                  name="measurement"
                  placeholder="Measurement (e.g. 3mm tread)"
                  defaultValue={item.measurement ?? ""}
                  className="rounded border px-3 py-2 text-sm"
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  defaultValue={item.notes ?? ""}
                  className="rounded border px-3 py-2 text-sm"
                />
                <button type="submit" className="self-start rounded border px-3 py-1 text-sm">
                  Save
                </button>
              </form>

              <div className="mt-2 flex flex-wrap gap-2">
                {item.photo_urls.map((path) =>
                  photoSignedUrls[path] ? (
                    <MediaThumb
                      key={path}
                      path={path}
                      url={photoSignedUrls[path]}
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : null,
                )}
              </div>
              <div className="mt-2">
                <PhotoUpload itemId={item.id} jobId={job.id} workshopId={job.workshop_id} />
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase text-gray-500">
        Parts requests
      </h2>
      <div className="mb-3 flex flex-col gap-2">
        {!partsRequests || partsRequests.length === 0 ? (
          <p className="text-gray-600">None requested yet.</p>
        ) : (
          partsRequests.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border px-3 py-2">
              <span>{p.description}</span>
              <span className="text-xs uppercase text-gray-500">{p.status}</span>
            </div>
          ))
        )}
      </div>
      <form action={requestPart} className="flex gap-2">
        <input type="hidden" name="job_id" value={job.id} />
        <input
          name="description"
          placeholder="Part needed..."
          required
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded border px-3 py-2 text-sm">
          Request
        </button>
      </form>
    </main>
  );
}
