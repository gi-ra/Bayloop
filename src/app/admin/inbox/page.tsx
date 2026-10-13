import Link from "next/link";
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inbox</h1>
        <Link href="/admin" className="text-sm underline">
          Diary
        </Link>
      </div>

      {!messages || messages.length === 0 ? (
        <p className="text-gray-600">No messages yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded border px-4 py-2 ${
                m.direction === "inbound" ? "bg-gray-50" : ""
              }`}
            >
              <div className="mb-1 flex items-center justify-between text-sm text-gray-500">
                <span>
                  {m.direction === "inbound" ? "←" : "→"}{" "}
                  {m.customers
                    ? `${m.customers.first_name ?? ""} ${m.customers.last_name ?? ""} (${m.customers.phone ?? ""})`
                    : "Unknown"}
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs uppercase">
                    {m.channel}
                  </span>
                </span>
                <span>{new Date(m.sent_at).toLocaleString([], { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}</span>
              </div>
              <p>{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
