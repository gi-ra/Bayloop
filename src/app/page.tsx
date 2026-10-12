import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">Boyta Auto Centre</h1>
      <p className="text-gray-600">Bayloop — workshop management system.</p>
      <div className="flex flex-col gap-2">
        <Link href="/portal/login" className="rounded border px-3 py-2 text-center">
          Customer login
        </Link>
        <Link href="/staff/login" className="rounded border px-3 py-2 text-center">
          Staff login
        </Link>
      </div>
    </main>
  );
}
