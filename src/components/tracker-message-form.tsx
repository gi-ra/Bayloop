"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TrackerMessageForm({ token }: { token: string }) {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);

    const { error } = await supabase.rpc("send_tracker_message", {
      p_token: token,
      p_body: message,
    });

    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage("");
    setSent(true);
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
        Have a question?
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setSent(false);
          }}
          placeholder="Message the workshop..."
          required
          maxLength={1000}
          rows={3}
          className="rounded border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="self-start rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
      {sent && <p className="mt-2 text-sm text-green-700">Sent — we&apos;ll get back to you.</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
