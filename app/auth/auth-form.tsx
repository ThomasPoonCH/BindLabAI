"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(mode: "signin" | "signup") {
    setBusy(true);
    setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
      setMessage(result.error ? "Authentication could not be completed. Check your details and try again." : mode === "signin" ? "Signed in successfully." : "Check your email to confirm the new account.");
      if (!result.error && mode === "signin") location.href = "/account";
    } catch {
      setMessage("Secure account access is not configured for this deployment.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mt-8 rounded-md border border-ink/10 bg-white p-5 shadow-sm">
    <label className="grid gap-2 text-sm font-semibold">Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="rounded-md border border-ink/15 px-3 py-3 font-normal" /></label>
    <label className="mt-4 grid gap-2 text-sm font-semibold">Password<input type="password" autoComplete="current-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} className="rounded-md border border-ink/15 px-3 py-3 font-normal" /></label>
    <div className="mt-5 flex flex-wrap gap-3">
      <button type="button" disabled={busy || !email || password.length < 8} onClick={() => void submit("signin")} className="rounded-md bg-ink px-4 py-2.5 font-semibold text-paper disabled:opacity-40">Sign in</button>
      <button type="button" disabled={busy || !email || password.length < 8} onClick={() => void submit("signup")} className="rounded-md border border-ink/20 px-4 py-2.5 font-semibold disabled:opacity-40">Create account</button>
    </div>
    {message && <p role="status" className="mt-4 rounded-md bg-paper p-3 text-sm">{message}</p>}
  </section>;
}
