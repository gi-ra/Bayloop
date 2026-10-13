export function AuthLogo() {
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
        stroke="#2F7A73"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M52 8c0 8.837-7.163 16-16 16S20 16.837 20 8"
        stroke="#2F7A73"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F5F5] px-4 py-10">
      <div className="w-full max-w-[420px] rounded-2xl bg-white px-8 py-10 shadow-sm">
        <AuthLogo />
        <h1 className="mb-7 text-center text-xl font-bold text-gray-900">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function AuthField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-gray-800">
        {label}
        {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}

export const authInputClass =
  "w-full rounded-lg border-0 bg-[#F2F3F3] px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F7A73]";

export const authButtonClass =
  "w-full rounded-full bg-[#2F7A73] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#276861] disabled:opacity-50";

export const authLinkClass = "text-sm font-medium text-[#2F7A73] hover:underline";
