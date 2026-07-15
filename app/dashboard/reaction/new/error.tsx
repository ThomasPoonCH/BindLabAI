"use client";

import Link from "next/link";

export default function NewReactionError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">BindLab</p><h1 className="mt-3 text-3xl font-semibold">BindLab could not load the Experiment Builder.</h1><p className="mt-4 text-ink/65">The page did not load correctly. Try again or return to your dashboard.</p><div className="mt-8 flex justify-center gap-3"><button type="button" onClick={reset} className="rounded-md bg-ink px-4 py-2 font-semibold text-paper">Retry</button><Link href="/dashboard" className="rounded-md border border-ink/15 px-4 py-2 font-semibold">Return to Dashboard</Link></div></main>;
}
