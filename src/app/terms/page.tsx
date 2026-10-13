import { createClient } from "@/lib/supabase/server";
import { getWorkshopBranding } from "@/lib/branding";

export default async function TermsPage() {
  const supabase = await createClient();
  const branding = await getWorkshopBranding(supabase);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-gray-800">
      <h1 className="mb-2 text-2xl font-bold">Terms of Service</h1>
      <p className="mb-8 text-sm text-gray-500">Last updated: {new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}</p>

      <p className="mb-6">
        These terms apply whenever you book a service with {branding.name} (&quot;we&quot;,
        &quot;us&quot;, &quot;our&quot;), whether online, by phone, or in person. By booking a
        service, you agree to these terms.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">1. Bookings and estimates</h2>
      <p className="mb-6">
        Prices shown before your vehicle is inspected are estimates only. The final price
        depends on what we find once we inspect your vehicle, and on which repairs you choose to
        approve.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">2. Approvals</h2>
      <p className="mb-6">
        We will contact you with our findings before carrying out any work beyond what you
        originally booked. Additional work is only carried out once you&apos;ve approved it,
        either online or by reply to our message.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">3. Pricing and GST</h2>
      <p className="mb-6">
        All prices are in Australian dollars and include GST unless stated otherwise. Tax
        invoices are provided for all work carried out.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">4. Payment</h2>
      <p className="mb-6">
        Payment is due on collection of your vehicle unless other arrangements have been agreed
        in advance. We accept online payment by card via our secure payment provider.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">5. Vehicle collection</h2>
      <p className="mb-6">
        Please collect your vehicle within a reasonable time of being notified it&apos;s ready.
        We&apos;ll let you know if any storage arrangements are needed for a longer delay.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">6. Warranty</h2>
      <p className="mb-6">
        Repairs are carried out to a professional standard. Specific warranty terms for parts
        and labour will be provided with your invoice. Parts supplied by third-party
        manufacturers carry their own manufacturer warranty.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">7. Cancellations</h2>
      <p className="mb-6">
        If you need to cancel or reschedule a booking, please let us know as soon as possible so
        we can offer the time to another customer.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">8. Liability</h2>
      <p className="mb-6">
        Nothing in these terms excludes any guarantee, right, or remedy you have under the
        Australian Consumer Law that cannot lawfully be excluded.
      </p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">9. Governing law</h2>
      <p className="mb-6">These terms are governed by the laws of Australia.</p>

      <h2 className="mb-2 mt-8 text-lg font-semibold">10. Contact us</h2>
      <p className="mb-6">
        Questions about these terms can be sent to{" "}
        <span className="font-medium">[insert contact email]</span> or{" "}
        <span className="font-medium">[insert phone number]</span>.
      </p>

      <p className="text-sm text-gray-500">
        ABN: [insert ABN] · {branding.name}, [insert business address]
      </p>
    </main>
  );
}
