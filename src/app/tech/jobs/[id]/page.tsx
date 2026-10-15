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
  { value: "good", label: "Good", activeClass: "bg-green-600 text-white border-green-600" },
  { value: "monitor", label: "Monitor", activeClass: "bg-amber-500 text-white border-amber-500" },
  { value: "urgent", label: "Urgent", activeClass: "bg-red-600 text-white border-red-600" },
];

const PARTS_STATUS_COLORS: Record<string, string> = {
  requested: "bg-gray-100 text-gray-700",
  ordered: "bg-amber-100 text-amber-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const inputClass =
  "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--brand)] focus:bg-white focus:outline-none";

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

  const doneCount = items.filter((i) => i.rating).length;

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <Link
        href="/tech"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-gray-500"
      >
        <span aria-hidden>←</span> Run sheet
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          {vehicle?.make} {vehicle?.model}
          {vehicle?.rego && <span className="text-gray-400"> · {vehicle.rego}</span>}
        </h1>
        {items.length > 0 && (
          <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            {doneCount}/{items.length} checked
          </span>
        )}
      </div>

      {!inspection ? (
        <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <p className="mb-4 text-sm text-gray-500">
            No inspection started yet for this job.
          </p>
          <form action={startInspection}>
            <input type="hidden" name="job_id" value={job.id} />
            <button
              type="submit"
              className="rounded-full bg-[var(--brand)] px-6 py-3 text-base font-semibold text-white"
            >
              Start inspection
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-3 font-semibold text-gray-900">{item.label}</div>

              <form action={updateInspectionItem} className="flex flex-col gap-2">
                <input type="hidden" name="item_id" value={item.id} />
                <input type="hidden" name="job_id" value={job.id} />

                <div className="flex gap-2">
                  {RATINGS.map((r) => (
                    <label
                      key={r.value}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        item.rating === r.value
                          ? r.activeClass
                          : "border-gray-200 text-gray-600"
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
                  className={inputClass}
                />
                <textarea
                  name="notes"
                  placeholder="Notes"
                  defaultValue={item.notes ?? ""}
                  rows={2}
                  className={inputClass}
                />
                <button
                  type="submit"
                  className="self-start rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700"
                >
                  Save
                </button>
              </form>

              {item.photo_urls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.photo_urls.map((path) =>
                    photoSignedUrls[path] ? (
                      <MediaThumb
                        key={path}
                        path={path}
                        url={photoSignedUrls[path]}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : null,
                  )}
                </div>
              )}
              <div className="mt-3">
                <PhotoUpload itemId={item.id} jobId={job.id} workshopId={job.workshop_id} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-gray-900">Parts requests</h2>
        </div>

        {!partsRequests || partsRequests.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">None requested yet.</p>
        ) : (
          <div className="divide-y">
            {partsRequests.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="text-sm text-gray-900">{p.description}</span>
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${PARTS_STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <form action={requestPart} className="flex gap-2 border-t p-4">
          <input type="hidden" name="job_id" value={job.id} />
          <input
            name="description"
            placeholder="Part needed..."
            required
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
          >
            Request
          </button>
        </form>
      </div>
    </main>
  );
}
