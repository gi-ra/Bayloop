const DEFAULT_BRAND_COLOR = "#2F7A73";

export function AuthLogo({
  logoUrl,
  brandColor = DEFAULT_BRAND_COLOR,
}: {
  logoUrl?: string | null;
  brandColor?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt="" className="mx-auto mb-5 h-12 max-w-[180px] object-contain" />
    );
  }

  return (
    <svg
      width="56"
      height="36"
      viewBox="0 0 56 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-5"
      aria-hidden="true"
    >
      <path
        d="M4 28c0-8.837 7.163-16 16-16s16 7.163 16 16"
        stroke={brandColor}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M52 8c0 8.837-7.163 16-16 16S20 16.837 20 8"
        stroke={brandColor}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AuthCard({
  title,
  logoUrl,
  brandColor = DEFAULT_BRAND_COLOR,
  dark = false,
  children,
}: {
  title: string;
  logoUrl?: string | null;
  brandColor?: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main
      className={`flex min-h-screen items-center justify-center px-4 py-10 ${
        dark ? "bg-[#17181A]" : "bg-[#F4F5F5]"
      }`}
      style={{ ["--brand" as string]: brandColor }}
    >
      <div
        className={`w-full max-w-[420px] rounded-2xl px-8 py-10 ${
          dark ? "bg-[#232528] shadow-none" : "bg-white shadow-sm"
        }`}
      >
        <AuthLogo logoUrl={logoUrl} brandColor={brandColor} />
        <h1
          className={`mb-7 text-center text-xl font-bold ${dark ? "text-white" : "text-gray-900"}`}
        >
          {title}
        </h1>
        {children}
      </div>
    </main>
  );
}

export function AuthField({
  label,
  required,
  dark = false,
  children,
}: {
  label: string;
  required?: boolean;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        className={`mb-1.5 block text-sm font-semibold ${dark ? "text-gray-200" : "text-gray-800"}`}
      >
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}

export function authInputClass(dark = false) {
  return dark
    ? "w-full rounded-lg border-0 bg-[#2E3033] px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
    : "w-full rounded-lg border-0 bg-[#F2F3F3] px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]";
}

export const authButtonClass =
  "w-full rounded-full bg-[var(--brand)] px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50";

export const authLinkClass = "text-sm font-medium text-[var(--brand)] hover:underline";

export function authSecondaryLinkClass(dark = false) {
  return dark
    ? "block w-full rounded-full border border-gray-600 px-4 py-3 text-center font-medium text-gray-200 hover:bg-white/5"
    : "block w-full rounded-full border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50";
}
