import { createClient } from "@/lib/supabase/server";
import { upsertStockItem } from "@/app/actions/parts";
import { StockTable } from "@/components/stock-table";

export default async function StockPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("stock_items")
    .select("id, sku, name, qty_on_hand, low_stock_threshold, unit_cost")
    .order("name");

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Stock</h1>

      <div className="mb-8">
        <StockTable items={items ?? []} />
      </div>

      <div className="max-w-md rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-gray-900">Add stock item</h2>
        <form action={upsertStockItem} className="flex flex-col gap-3">
          <input
            name="name"
            placeholder="Name"
            required
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="sku"
              placeholder="SKU (optional)"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
            <input
              name="unit_cost"
              type="number"
              step="0.01"
              placeholder="Unit cost"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="qty_on_hand"
              type="number"
              placeholder="Qty on hand"
              defaultValue="0"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
            <input
              name="low_stock_threshold"
              type="number"
              placeholder="Low stock alert below"
              defaultValue="0"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="self-start rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
          >
            Add item
          </button>
        </form>
      </div>
    </main>
  );
}
