"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaEnrollPage() {
  const router = useRouter();
  const supabase = createClient();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function startEnrollment() {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) {
        setError(error.message);
        return;
      }
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    }
    startEnrollment();
  }, [supabase]);

  async function confirmEnrollment(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setLoading(false);
      setError(challengeError?.message ?? "Could not start verification.");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });

    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/staff");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Set up two-factor login</h1>
      <p className="text-sm text-gray-600">
        Staff accounts require an authenticator app (Google Authenticator, 1Password,
        Authy, etc.) in addition to your password. Scan this code to add Bayloop.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {qrCode && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrCode} alt="Scan with your authenticator app" className="h-48 w-48 self-center" />
      )}

      {secret && (
        <p className="text-xs text-gray-500">
          Can&apos;t scan? Enter this code manually: <code>{secret}</code>
        </p>
      )}

      <form onSubmit={confirmEnrollment} className="flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="code">
          Enter the 6-digit code from the app to confirm
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded border px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading || !factorId}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Confirming..." : "Confirm and finish"}
        </button>
      </form>
    </main>
  );
}
