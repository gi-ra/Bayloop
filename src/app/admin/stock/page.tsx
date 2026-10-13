import { createClient } from "@/lib/supabase/server";
import { upsertStockItem } from "@/app/actions/parts";

export default async function StockPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("stock_items")
    .select("id, sku, name, qty_on_hand, low_stock_threshold, unit_cost")
    .order("name");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-xl font-semibold">Stock</h1>

      <div className="mb-6 flex flex-col gap-2">
        {!items || items.length === 0 ? (
          <p className="text-gray-600">No stock items yet.</p>
        ) : (
          items.map((item) => {
            const low = item.qty_on_hand <= item.low_stock_threshold;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded border px-3 py-2 ${
                  low ? "border-red-300 bg-red-50" : ""
                }`}
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">{item.sku}</div>
                </div>
                <div className="text-right">
                  <div className={low ? "font-medium text-red-700" : ""}>
                    {item.qty_on_hand} on hand
                  </div>
                  {low && <div className="text-xs text-red-600">Low stock</div>}
                </div>
              </div>
            );
          })
        )}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Add stock item</h2>
      <form action={upsertStockItem} className="flex flex-col gap-2">
        <input name="name" placeholder="Name" required className="rounded border px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input name="sku" placeholder="SKU (optional)" className="rounded border px-3 py-2 text-sm" />
          <input
            name="unit_cost"
            type="number"
            step="0.01"
            placeholder="Unit cost"
            className="rounded border px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            name="qty_on_hand"
            type="number"
            placeholder="Qty on hand"
            defaultValue="0"
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            name="low_stock_threshold"
            type="number"
            placeholder="Low stock alert below"
            defaultValue="0"
            className="rounded border px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="self-start rounded bg-black px-4 py-2 text-white">
          Add item
        </button>
      </form>
    </main>
  );
}
