import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="mt-8 flex justify-center gap-4 pb-6 text-xs text-gray-400">
      <Link href="/privacy" className="hover:underline">
        Privacy Policy
      </Link>
      <Link href="/terms" className="hover:underline">
        Terms of Service
      </Link>
    </footer>
  );
}
