import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";

export default async function PrivacyPolicyPage() {
  const supabase = await createClient();
  const branding = await getWorkshopBranding(supabase);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-gray-800">
      <h1 className="mb-2 text-2xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p className="mb-6">
        {branding.name} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to
        protecting your privacy in accordance with the Australian Privacy Principles under the
        Privacy Act 1988 (Cth). This policy explains what personal information we collect, how
        we use it, and your rights regarding it.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">1. Information we collect</h2>
      <p className="mb-2">When you book a service, create an account, or contact us, we may collect:</p>
      <ul className="mb-6 list-disc pl-6">
        <li>Your name, mobile number, and email address</li>
        <li>Vehicle details (registration, make, model, VIN, odometer reading)</li>
        <li>Service history, inspection findings, quotes, and invoices</li>
        <li>Messages you send us through the booking form, live tracker, or SMS</li>
        <li>
          Payment is processed directly by our payment provider (Stripe) — we never see or
          store your full card details
        </li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-semibold">2. How we use your information</h2>
      <ul className="mb-6 list-disc pl-6">
        <li>To book, carry out, and invoice the services you request</li>
        <li>To send you updates about your vehicle&apos;s progress (via SMS and/or email)</li>
        <li>To send service or registration reminders</li>
        <li>To respond to questions you send us</li>
        <li>
          To send marketing messages — only if you&apos;ve opted in, and you can opt out at any
          time
        </li>
      </ul>

      <h2 className="mb-2 mt-8 text-lg font-semibold">3. Who we share it with</h2>
      <p className="mb-2">
        We share limited information with trusted service providers who help us run this
        system, and only what&apos;s needed for them to do their job:
      </p>
      <ul className="mb-6 list-disc pl-6">
        <li>
          <strong>Supabase</strong> — hosts our database and file storage (Sydney, Australia
          region)
        </li>
        <li>
          <strong>ClickSend</strong> — sends SMS updates and receives your text replies
        </li>
        <li>
          <strong>Resend</strong> — sends email updates
        </li>
        <li>
          <strong>Stripe</strong> — processes payments securely; we never store your card
          details
        </li>
      </ul>
      <p className="mb-6">We do not sell your personal information to anyone.</p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">4. Where your data is stored</h2>
      <p className="mb-6">
        Your data is stored on servers located in Australia. We take reasonable technical and
        organisational measures to keep it secure, including role-based access controls so that
        staff only see what&apos;s relevant to their role, and you can only ever see your own
        information.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">5. Marketing messages</h2>
      <p className="mb-6">
        Messages about your actual booking or job (confirmations, status updates, invoices) are
        service messages, not marketing, and you&apos;ll receive these as part of using our
        service. Marketing messages are only sent with your consent, and every marketing message
        includes a way to opt out, in line with the Spam Act 2003 (Cth).
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">6. Accessing or correcting your information</h2>
      <p className="mb-6">
        You can ask us for a copy of the personal information we hold about you, or ask us to
        correct it, at any time by contacting us using the details below.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">7. Changes to this policy</h2>
      <p className="mb-6">
        We may update this policy from time to time. The &quot;last updated&quot; date at the
        top of this page shows when it was last changed.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">8. Contact us</h2>
      <p className="mb-6">
        If you have any questions about this policy or your personal information, contact us at{" "}
        <span className="font-medium">[insert contact email]</span> or{" "}
        <span className="font-medium">[insert phone number]</span>.
      </p>

      <p className="text-sm text-gray-500">
        ABN: [insert ABN] · {branding.name}, [insert business address]
      </p>
    </main>
  );
}
