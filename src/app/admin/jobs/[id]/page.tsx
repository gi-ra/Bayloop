import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addQuoteLine, sendQuote } from "@/app/actions/quotes";
import { createAndSendInvoice } from "@/app/actions/invoices";

type InspectionItem = {
  id: string;
  label: string;
  rating: string | null;
  notes: string | null;
  measurement: string | null;
};

type QuoteLine = {
  id: string;
  type: string;
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

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status, customers(first_name, last_name), vehicles(rego, make, model)")
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
      .select("id, label, rating, notes, measurement")
      .eq("inspection_id", inspection.id)
      .order("sort_order");
    items = data ?? [];
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
      .select("id, type, description, tier, qty, unit_price, approved")
      .eq("quote_id", quote.id)
      .order("created_at");
    quoteLines = data ?? [];
  }

  const hasApprovedLines = quoteLines.some((l) => l.approved === true);
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, total, status")
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const customer = job.customers as unknown as {
    first_name: string | null;
    last_name: string | null;
  } | null;
  const vehicle = job.vehicles as unknown as {
    rego: string | null;
    make: string | null;
    model: string | null;
  } | null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        {vehicle?.make} {vehicle?.model} ({vehicle?.rego})
      </h1>
      <p className="mb-6 text-gray-600">
        {customer?.first_name} {customer?.last_name} ·{" "}
        <span className="capitalize">{job.status.replaceAll("_", " ")}</span>
      </p>

      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Inspection findings</h2>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No inspection yet.</p>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  {item.measurement && (
                    <div className="text-sm text-gray-500">{item.measurement}</div>
                  )}
                  {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                </div>
                {item.rating && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${RATING_COLORS[item.rating] ?? ""}`}
                  >
                    {item.rating}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3">
          <h2 className="font-semibold text-gray-900">Quote</h2>
        </div>
        {quoteLines.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No quote lines yet.</p>
        ) : (
          <div className="divide-y">
            {quoteLines.map((line) => (
              <div key={line.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-gray-900">
                    {line.description}
                    {line.tier && (
                      <span className="ml-2 text-xs font-normal uppercase text-gray-500">
                        {line.tier}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500">
                    {line.qty} × ${line.unit_price}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    line.approved === null
                      ? "bg-amber-100 text-amber-700"
                      : line.approved
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {line.approved === null ? "Pending" : line.approved ? "Approved" : "Declined"}
                </span>
              </div>
            ))}
          </div>
        )}

        {(!quote || quote.status === "draft") && (
          <div className="border-t bg-gray-50 px-5 py-4">
            <form action={addQuoteLine} className="mb-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="job_id" value={job.id} />
              <select
                name="type"
                required
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="part">Part</option>
                <option value="labour">Labour</option>
              </select>
              <select
                name="tier"
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">No tier</option>
                <option value="good">Good</option>
                <option value="better">Better</option>
                <option value="best">Best</option>
              </select>
              <input
                name="description"
                placeholder="Description"
                required
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              />
              <input
                name="qty"
                type="number"
                step="0.01"
                defaultValue="1"
                placeholder="Qty"
                className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              />
              <input
                name="unit_price"
                type="number"
                step="0.01"
                required
                placeholder="Unit price"
                className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium"
              >
                Add line
              </button>
            </form>

            {quoteLines.length > 0 && (
              <form action={sendQuote}>
                <input type="hidden" name="job_id" value={job.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
                >
                  Send quote to customer
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Invoice</h2>
        {invoice ? (
          <div className="text-sm">
            <span className="font-medium text-gray-900">${invoice.total.toFixed(2)}</span>{" "}
            <span className="capitalize text-gray-500">— {invoice.status}</span>
          </div>
        ) : hasApprovedLines ? (
          <form action={createAndSendInvoice}>
            <input type="hidden" name="job_id" value={job.id} />
            <button
              type="submit"
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
            >
              Send invoice &amp; payment link
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500">No approved quote lines to invoice yet.</p>
        )}
      </div>
    </main>
  );
}
