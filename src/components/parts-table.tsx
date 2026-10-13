"use client";

import { Fragment, useState } from "react";
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

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  ordered: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
};

export function PartsTable({ requests }: { requests: RequestRow[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = requests.filter((r) => {
    const haystack = [
      r.description,
      r.jobs?.vehicles?.make,
      r.jobs?.vehicles?.model,
      r.jobs?.vehicles?.rego,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="font-semibold text-gray-900">Parts queue</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter..."
          className="w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">No part requests yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-2.5 font-medium">Part</th>
                <th className="px-5 py-2.5 font-medium">Vehicle</th>
                <th className="px-5 py-2.5 font-medium">Supplier / Cost</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const po = r.purchase_orders[0];
                const isExpanded = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{r.description}</td>
                      <td className="px-5 py-3 text-gray-600">
                        {r.jobs?.vehicles?.make} {r.jobs?.vehicles?.model} (
                        {r.jobs?.vehicles?.rego})
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {po ? `${po.suppliers?.name ?? ""} · $${po.cost ?? "—"}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {r.status === "requested" && (
                          <button
                            onClick={() => setExpanded(isExpanded ? null : r.id)}
                            className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white"
                          >
                            {isExpanded ? "Cancel" : "Order"}
                          </button>
                        )}
                        {r.status === "ordered" && po && (
                          <form action={receivePart}>
                            <input type="hidden" name="purchase_order_id" value={po.id} />
                            <input type="hidden" name="parts_request_id" value={r.id} />
                            <button
                              type="submit"
                              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                            >
                              Mark received
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.id}-form`} className="border-b bg-gray-50 last:border-0">
                        <td colSpan={5} className="px-5 py-4">
                          <form action={orderPart} className="flex flex-wrap items-end gap-2">
                            <input type="hidden" name="parts_request_id" value={r.id} />
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Supplier</label>
                              <input
                                name="supplier_name"
                                placeholder="e.g. Burson"
                                required
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Part number</label>
                              <input
                                name="part_number"
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Cost</label>
                              <input
                                name="cost"
                                type="number"
                                step="0.01"
                                className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Quoted $</label>
                              <input
                                name="quoted_price"
                                type="number"
                                step="0.01"
                                className="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Expected</label>
                              <input
                                name="expected_at"
                                type="date"
                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
                              />
                            </div>
                            <button
                              type="submit"
                              className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white"
                            >
                              Confirm order
                            </button>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
