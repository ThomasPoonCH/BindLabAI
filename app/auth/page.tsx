import type { Metadata } from "next";
import { AuthForm } from "./auth-form";

export const metadata: Metadata = { title: "Account | BindLab", robots: { index: false, follow: false } };

export default function AuthPage() {
  return <main className="mx-auto min-h-[70vh] max-w-xl px-5 py-20 sm:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Secure account</p>
    <h1 className="mt-3 text-4xl font-semibold">Sign in to BindLab</h1>
    <p className="mt-4 leading-7 text-ink/65">Authentication is available for the secure cloud-storage foundation. Local experiment records remain available without an account.</p>
    <AuthForm />
  </main>;
}
