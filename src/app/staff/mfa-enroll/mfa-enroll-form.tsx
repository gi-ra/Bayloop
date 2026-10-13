"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, AuthField, authInputClass, authButtonClass } from "@/components/auth-card";
import type { WorkshopBranding } from "@/lib/branding";

export function MfaEnrollForm({ branding }: { branding: WorkshopBranding }) {
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
    <AuthCard
      title="Set up two-factor login"
      logoUrl={branding.logoUrl}
      brandColor={branding.brandColor}
    >
      <p className="mb-5 text-center text-sm text-gray-500">
        Staff accounts require an authenticator app (Google Authenticator, 1Password,
        Authy, etc.) in addition to your password. Scan this code to add Bayloop.
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {qrCode && (
        <div className="mb-4 flex justify-center rounded-lg bg-[#F2F3F3] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Scan with your authenticator app" className="h-40 w-40" />
        </div>
      )}

      {secret && (
        <p className="mb-5 text-center text-xs text-gray-500">
          Can&apos;t scan? Enter this code manually: <code>{secret}</code>
        </p>
      )}

      <form onSubmit={confirmEnrollment}>
        <AuthField label="6-digit code from the app" required>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            required
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        <button type="submit" disabled={loading || !factorId} className={authButtonClass}>
          {loading ? "Confirming..." : "Confirm and finish"}
        </button>
      </form>
    </AuthCard>
  );
}
