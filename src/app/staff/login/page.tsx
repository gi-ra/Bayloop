"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, AuthField, authInputClass, authButtonClass } from "@/components/auth-card";

export default function StaffLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"password" | "mfa">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Password is correct. Check whether this account still needs to
    // complete a two-factor challenge before it's fully logged in.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    setLoading(false);

    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      setStep("mfa");
      return;
    }

    // No two-factor enrolled yet — every staff account is required to
    // have one, so send them straight to set it up.
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (!factors || factors.totp.length === 0) {
      router.push("/staff/mfa-enroll");
      return;
    }

    router.push("/staff");
    router.refresh();
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factorId = factors?.totp[0]?.id;
    if (!factorId) {
      setLoading(false);
      setError("No two-factor method found on this account.");
      return;
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setLoading(false);
      setError(challengeError?.message ?? "Could not start the two-factor check.");
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
    <AuthCard title={step === "password" ? "Staff login" : "Enter your two-factor code"}>
      {step === "password" ? (
        <form onSubmit={signIn}>
          <AuthField label="Email" required>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
            />
          </AuthField>
          <AuthField label="Password" required>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </AuthField>
          <button type="submit" disabled={loading} className={authButtonClass}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyMfa}>
          <AuthField label="Code from your authenticator app" required>
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
          <button type="submit" disabled={loading} className={authButtonClass}>
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </AuthCard>
  );
}
