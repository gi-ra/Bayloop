import Link from "next/link";
import { AuthLogo } from "@/components/auth-card";

// This is Bayloop's own product homepage — generic branding, not any
// one workshop's. Individual workshops' own branding (logo/color) shows
// up on their login, booking, and tracker pages instead, not here.
const BAYLOOP_BRAND_COLOR = "#2F7A73";

const FEATURES = [
  {
    title: "Online bookings",
    description: "Customers book online with live availability — no phone tag.",
  },
  {
    title: "Automatic updates",
    description:
      "Every status change texts and emails the customer, with a live tracker link — no app to download.",
  },
  {
    title: "Digital inspections",
    description: "Photo-backed checklists, rated Good / Monitor / Urgent for every job.",
  },
  {
    title: "Online quote approval",
    description:
      "Customers review findings and approve or decline each line — Good / Better / Best pricing tiers included.",
  },
  {
    title: "Online invoicing & payments",
    description: "GST-correct invoices with secure card payment, paid straight into your account.",
  },
  {
    title: "Owner reports",
    description:
      "True job profit, technician hours, approval rate, and comeback tracking — all in one place.",
  },
];

export default function Home() {
  return (
    <main style={{ ["--brand" as string]: BAYLOOP_BRAND_COLOR }}>
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <AuthLogo brandColor={BAYLOOP_BRAND_COLOR} />
          <span className="text-lg font-bold">Bayloop</span>
        </div>
        <Link
          href="/staff/login"
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium"
        >
          Login
        </Link>
      </header>

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-900">
          Run the workshop without the chaos
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Bookings, inspections, quotes, invoicing, parts, and profit — one system that keeps
          customers in the loop automatically, so nobody has to phone in to ask &quot;is my car
          ready?&quot;
        </p>
        <Link
          href="/staff/login"
          className="inline-block rounded-full bg-[var(--brand)] px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90"
        >
          Login
        </Link>
      </section>

      <section className="bg-[#F7F8F8] px-6 py-16">
        <h2 className="mx-auto mb-10 max-w-2xl text-center text-2xl font-bold text-gray-900">
          Everything the workshop needs, already built in
        </h2>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3 h-2 w-8 rounded-full bg-[var(--brand)]" />
              <h3 className="mb-2 font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Bayloop
      </footer>
    </main>
  );
}
