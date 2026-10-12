import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { customerDecideQuoteLine } from "@/app/actions/quotes";

type InspectionItem = {
  id: string;
  label: string;
  rating: string | null;
  notes: string | null;
  photo_urls: string[];
};

type QuoteLine = {
  id: string;
  description: string;
  tier: string | null;
  qty: number;
  unit_price: number;
  approved: boolean | null;
};

const RATING_COLORS: Record<string, string> = {
  good: "bg-green-100 text-green-700",
  monitor: "bg-yellow-100 text-yellow-700",
  urgent: "bg-red-100 text-red-700",
};

export default async function CustomerJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, vehicles(rego, make, model)")
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
      .select("id, label, rating, notes, photo_urls")
      .eq("inspection_id", inspection.id)
      .not("rating", "is", null)
      .order("sort_order");
    items = data ?? [];
  }

  const photoSignedUrls: Record<string, string> = {};
  for (const item of items) {
    for (const path of item.photo_urls) {
      const { data } = await supabase.storage.from("job-photos").createSignedUrl(path, 3600);
      if (data) photoSignedUrls[path] = data.signedUrl;
    }
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status")
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let quoteLines: QuoteLine[] = [];
  if (quote) {
    const { data } = await supabase
      .from("quote_lines")
      .select("id, description, tier, qty, unit_price, approved")
      .eq("quote_id", quote.id)
      .order("created_at");
    quoteLines = data ?? [];
  }

  const vehicle = job.vehicles as unknown as {
    rego: string | null;
    make: string | null;
    model: string | null;
  } | null;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">
        {vehicle?.make} {vehicle?.model} ({vehicle?.rego})
      </h1>
      <p className="mb-6 text-gray-600">{job.status.replaceAll("_", " ")}</p>

      {items.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Inspection findings
          </h2>
          <div className="mb-6 flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="rounded border px-3 py-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{item.label}</div>
                    {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-xs uppercase ${RATING_COLORS[item.rating!] ?? ""}`}
                  >
                    {item.rating}
                  </span>
                </div>
                {item.photo_urls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.photo_urls.map((path) =>
                      photoSignedUrls[path] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={path}
                          src={photoSignedUrls[path]}
                          alt=""
                          className="h-20 w-20 rounded object-cover"
                        />
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {quote && quoteLines.length > 0 && (
        <>
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
            Recommended work
          </h2>
          <div className="flex flex-col gap-3">
            {quoteLines.map((line) => (
              <div key={line.id} className="rounded border p-3">
                <div className="mb-1">
                  {line.description}
                  {line.tier && (
                    <span className="ml-2 text-xs uppercase text-gray-500">{line.tier}</span>
                  )}
                </div>
                <div className="mb-2 text-sm text-gray-500">
                  {line.qty} × ${line.unit_price} = ${(line.qty * line.unit_price).toFixed(2)}
                </div>

                {line.approved === null ? (
                  <div className="flex gap-2">
                    <form action={customerDecideQuoteLine}>
                      <input type="hidden" name="line_id" value={line.id} />
                      <input type="hidden" name="approved" value="true" />
                      <button
                        type="submit"
                        className="rounded bg-black px-3 py-2 text-sm text-white"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={customerDecideQuoteLine}>
                      <input type="hidden" name="line_id" value={line.id} />
                      <input type="hidden" name="approved" value="false" />
                      <button type="submit" className="rounded border px-3 py-2 text-sm">
                        Decline
                      </button>
                    </form>
                  </div>
                ) : (
                  <span className="text-sm font-medium">
                    {line.approved ? "Approved" : "Declined"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
