"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AuthCard,
  AuthField,
  authInputClass,
  authButtonClass,
  authLinkClass,
} from "@/components/auth-card";
import type { WorkshopBranding } from "@/lib/branding";

export function CustomerLoginForm({ branding }: { branding: WorkshopBranding }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ phone });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/portal");
    router.refresh();
  }

  return (
    <AuthCard
      title={`Log in to ${branding.name}`}
      logoUrl={branding.logoUrl}
      brandColor={branding.brandColor}
    >
      {step === "phone" ? (
        <form onSubmit={sendCode}>
          <AuthField label="Mobile number" required>
            <input
              id="phone"
              type="tel"
              required
              placeholder="+61 4xx xxx xxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={authInputClass}
            />
          </AuthField>
          <button type="submit" disabled={loading} className={authButtonClass}>
            {loading ? "Sending..." : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode}>
          <AuthField label="6-digit code" required>
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
          <button
            type="button"
            onClick={() => setStep("phone")}
            className={`${authLinkClass} mt-4 block w-full text-center`}
          >
            Use a different number
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </AuthCard>
  );
}
