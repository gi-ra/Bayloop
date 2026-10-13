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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold">
        {vehicle?.make} {vehicle?.model} ({vehicle?.rego})
      </h1>
      <p className="mb-6 text-gray-600">
        {customer?.first_name} {customer?.last_name} ·{" "}
        {job.status.replaceAll("_", " ")}
      </p>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
        Inspection findings
      </h2>
      {items.length === 0 ? (
        <p className="mb-6 text-gray-600">No inspection yet.</p>
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between rounded border px-3 py-2">
              <div>
                <div className="font-medium">{item.label}</div>
                {item.measurement && (
                  <div className="text-sm text-gray-500">{item.measurement}</div>
                )}
                {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
              </div>
              {item.rating && (
                <span
                  className={`rounded px-2 py-0.5 text-xs uppercase ${RATING_COLORS[item.rating] ?? ""}`}
                >
                  {item.rating}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Quote</h2>
      <div className="mb-4 flex flex-col gap-2">
        {quoteLines.length === 0 ? (
          <p className="text-gray-600">No quote lines yet.</p>
        ) : (
          quoteLines.map((line) => (
            <div key={line.id} className="flex items-center justify-between rounded border px-3 py-2">
              <div>
                <div>
                  {line.description}
                  {line.tier && (
                    <span className="ml-2 text-xs uppercase text-gray-500">{line.tier}</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {line.qty} × ${line.unit_price}
                </div>
              </div>
              <span className="text-sm">
                {line.approved === null ? "Pending" : line.approved ? "Approved" : "Declined"}
              </span>
            </div>
          ))
        )}
      </div>

      {(!quote || quote.status === "draft") && (
        <>
          <form action={addQuoteLine} className="mb-4 flex flex-col gap-2 rounded border p-3">
            <input type="hidden" name="job_id" value={job.id} />
            <div className="grid grid-cols-2 gap-2">
              <select name="type" required className="rounded border px-2 py-1 text-sm">
                <option value="part">Part</option>
                <option value="labour">Labour</option>
              </select>
              <select name="tier" className="rounded border px-2 py-1 text-sm">
                <option value="">No tier</option>
                <option value="good">Good</option>
                <option value="better">Better</option>
                <option value="best">Best</option>
              </select>
            </div>
            <input
              name="description"
              placeholder="Description"
              required
              className="rounded border px-2 py-1 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                name="qty"
                type="number"
                step="0.01"
                defaultValue="1"
                placeholder="Qty"
                className="rounded border px-2 py-1 text-sm"
              />
              <input
                name="unit_price"
                type="number"
                step="0.01"
                required
                placeholder="Unit price"
                className="rounded border px-2 py-1 text-sm"
              />
            </div>
            <button type="submit" className="self-start rounded border px-3 py-1 text-sm">
              Add line
            </button>
          </form>

          {quoteLines.length > 0 && (
            <form action={sendQuote}>
              <input type="hidden" name="job_id" value={job.id} />
              <button type="submit" className="rounded bg-black px-4 py-2 text-white">
                Send quote to customer
              </button>
            </form>
          )}
        </>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase text-gray-500">Invoice</h2>
      {invoice ? (
        <div className="rounded border px-3 py-2">
          ${invoice.total.toFixed(2)} —{" "}
          <span className="uppercase">{invoice.status}</span>
        </div>
      ) : hasApprovedLines ? (
        <form action={createAndSendInvoice}>
          <input type="hidden" name="job_id" value={job.id} />
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Send invoice &amp; payment link
          </button>
        </form>
      ) : (
        <p className="text-gray-600">No approved quote lines to invoice yet.</p>
      )}
    </main>
  );
}
