import { createClient } from "@/lib/supabase/server";
import { PartsTable } from "@/components/parts-table";

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
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Parts queue</h1>
      <PartsTable requests={requests ?? []} />
    </main>
  );
}
