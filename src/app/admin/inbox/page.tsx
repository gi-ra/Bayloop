import { createClient } from "@/lib/supabase/server";

type MessageRow = {
  id: string;
  channel: string;
  direction: string;
  body: string;
  sent_at: string;
  customers: { first_name: string | null; last_name: string | null; phone: string | null } | null;
};

export default async function InboxPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("id, channel, direction, body, sent_at, customers(first_name, last_name, phone)")
    .order("sent_at", { ascending: false })
    .limit(100)
    .returns<MessageRow[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Inbox</h1>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {!messages || messages.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">No messages yet.</p>
        ) : (
          <div className="divide-y">
            {messages.map((m) => (
              <div key={m.id} className={`px-5 py-3 ${m.direction === "inbound" ? "bg-gray-50" : ""}`}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">
                    {m.direction === "inbound" ? "←" : "→"}{" "}
                    {m.customers
                      ? `${m.customers.first_name ?? ""} ${m.customers.last_name ?? ""} (${m.customers.phone ?? ""})`
                      : "Unknown"}
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase text-gray-600">
                      {m.channel}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    {new Date(m.sent_at).toLocaleString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{m.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
