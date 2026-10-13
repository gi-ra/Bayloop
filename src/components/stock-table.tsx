"use client";

import { useState } from "react";

type StockItem = {
  id: string;
  sku: string | null;
  name: string;
  qty_on_hand: number;
  low_stock_threshold: number;
  unit_cost: number | null;
};

export function StockTable({ items }: { items: StockItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = items.filter((i) => {
    const haystack = `${i.name} ${i.sku ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="font-semibold text-gray-900">Stock</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter..."
          className="w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">No stock items yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-2.5 font-medium">Item</th>
                <th className="px-5 py-2.5 font-medium">SKU</th>
                <th className="px-5 py-2.5 font-medium">Unit cost</th>
                <th className="px-5 py-2.5 font-medium">On hand</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const low = item.qty_on_hand <= item.low_stock_threshold;
                return (
                  <tr
                    key={item.id}
                    className={`border-b last:border-0 ${low ? "bg-red-50" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-5 py-3 text-gray-600">{item.sku ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {item.unit_cost != null ? `$${item.unit_cost}` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={low ? "font-medium text-red-700" : "text-gray-900"}>
                        {item.qty_on_hand}
                      </span>
                      {low && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Low stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
