"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignOutButton() {
  return <button type="button" onClick={async () => {
    try { await createBrowserSupabaseClient().auth.signOut(); } finally { location.href = "/"; }
  }} className="mt-8 rounded-md border border-ink/20 px-4 py-2.5 font-semibold">Sign out</button>;
}
