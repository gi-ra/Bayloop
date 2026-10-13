"use client";

import { useState } from "react";
import Link from "next/link";

type JobRow = {
  id: string;
  status: string;
  customers: { first_name: string | null; last_name: string | null } | null;
  vehicles: { rego: string | null; make: string | null; model: string | null } | null;
  bays: { name: string } | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  checked_in: "Checked in",
  inspecting: "Inspecting",
  awaiting_approval: "Awaiting approval",
  on_lift: "On the lift",
  waiting_on_parts: "Waiting on parts",
  road_test: "Road test",
  ready: "Ready for pickup",
  paid: "Paid",
};

const STATUS_COLORS: Record<string, string> = {
  checked_in: "bg-blue-100 text-blue-700",
  inspecting: "bg-purple-100 text-purple-700",
  awaiting_approval: "bg-amber-100 text-amber-700",
  on_lift: "bg-teal-100 text-teal-700",
  waiting_on_parts: "bg-orange-100 text-orange-700",
  road_test: "bg-indigo-100 text-indigo-700",
  ready: "bg-green-100 text-green-700",
  paid: "bg-gray-100 text-gray-700",
};

export function JobsTable({ jobs }: { jobs: JobRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = jobs.filter((j) => {
    const haystack = [
      j.customers?.first_name,
      j.customers?.last_name,
      j.vehicles?.make,
      j.vehicles?.model,
      j.vehicles?.rego,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="font-semibold text-gray-900">Active jobs</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter..."
          className="w-48 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-500">No active jobs right now.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-2.5 font-medium">Customer</th>
                <th className="px-5 py-2.5 font-medium">Vehicle</th>
                <th className="px-5 py-2.5 font-medium">Bay</th>
                <th className="px-5 py-2.5 font-medium">Technician</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/jobs/${j.id}`} className="font-medium text-gray-900 hover:underline">
                      {j.customers?.first_name} {j.customers?.last_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {j.vehicles?.make} {j.vehicles?.model} ({j.vehicles?.rego})
                  </td>
                  <td className="px-5 py-3 text-gray-600">{j.bays?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {j.profiles?.first_name} {j.profiles?.last_name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[j.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {STATUS_LABELS[j.status] ?? j.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
