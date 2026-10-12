import { signOut } from "@/app/actions/sign-out";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="text-sm underline">
        Sign out
      </button>
    </form>
  );
}
