import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export const metadata = { title: "Account | BindLab", robots: { index: false, follow: false } };

export default async function AccountPage() {
  let user = null;
  try {
    const supabase = createServerSupabaseClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    redirect("/auth");
  }
  if (!user) redirect("/auth");
  return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-20 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Account</p>
    <h1 className="mt-3 text-4xl font-semibold">Secure BindLab account</h1>
    <p className="mt-4 leading-7 text-ink/65">Signed in as {user.email}. Local records remain stored on this browser. Secure cloud saving stays unavailable in the interface until ownership testing and the production migration are confirmed.</p>
    <SignOutButton />
  </main>;
}
