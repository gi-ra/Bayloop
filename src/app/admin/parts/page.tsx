import { createClient } from "@/lib/supabase/server";
import { orderPart, receivePart } from "@/app/actions/parts";

type RequestRow = {
  id: string;
  description: string;
  status: string;
  jobs: {
    vehicles: { make: string | null; model: string | null; rego: string | null } | null;
  } | null;
  purchase_orders: {
    id: string;
    part_number: string | null;
    cost: number | null;
    expected_at: string | null;
    received_at: string | null;
    suppliers: { name: string } | null;
  }[];
};

export default async function PartsQueuePage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("parts_requests")
    .select(
      "id, description, status, jobs(vehicles(make, model, rego)), purchase_orders(id, part_number, cost, expected_at, received_at, suppliers(name))",
    )
    .order("created_at", { ascending: false })
    .returns<RequestRow[]>();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Parts queue</h1>

      {!requests || requests.length === 0 ? (
        <p className="text-gray-600">No part requests yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => {
            const po = r.purchase_orders[0];
            return (
              <div key={r.id} className="rounded border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{r.description}</span>
                  <span className="text-xs uppercase text-gray-500">{r.status}</span>
                </div>
                <div className="mb-2 text-sm text-gray-500">
                  {r.jobs?.vehicles?.make} {r.jobs?.vehicles?.model} ({r.jobs?.vehicles?.rego})
                </div>

                {r.status === "requested" && (
                  <form action={orderPart} className="flex flex-wrap gap-2">
                    <input type="hidden" name="parts_request_id" value={r.id} />
                    <input
                      name="supplier_name"
                      placeholder="Supplier (e.g. Burson)"
                      required
                      className="rounded border px-2 py-1 text-sm"
                    />
                    <input
                      name="part_number"
                      placeholder="Part number"
                      className="rounded border px-2 py-1 text-sm"
                    />
                    <input
                      name="cost"
                      type="number"
                      step="0.01"
                      placeholder="Cost"
                      className="w-24 rounded border px-2 py-1 text-sm"
                    />
                    <input
                      name="quoted_price"
                      type="number"
                      step="0.01"
                      placeholder="Quoted $"
                      className="w-24 rounded border px-2 py-1 text-sm"
                    />
                    <input name="expected_at" type="date" className="rounded border px-2 py-1 text-sm" />
                    <button type="submit" className="rounded bg-black px-3 py-1 text-sm text-white">
                      Order
                    </button>
                  </form>
                )}

                {r.status === "ordered" && po && (
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {po.suppliers?.name} · {po.part_number} · ${po.cost}
                      {po.expected_at && ` · due ${po.expected_at}`}
                    </span>
                    <form action={receivePart}>
                      <input type="hidden" name="purchase_order_id" value={po.id} />
                      <input type="hidden" name="parts_request_id" value={r.id} />
                      <button type="submit" className="rounded border px-3 py-1 text-sm">
                        Mark received
                      </button>
                    </form>
                  </div>
                )}

                {r.status === "received" && po && (
                  <div className="text-sm text-green-700">
                    Received · {po.suppliers?.name} · ${po.cost}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
