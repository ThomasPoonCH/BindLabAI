import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LocalExperiments } from "./experiments-client";

export default function MyExperimentsPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">Experiment archive</p>
            <h1 className="mt-2 text-3xl font-semibold">My Experiments</h1>
            <p className="mt-2 max-w-3xl text-ink/65">Saved local reaction workflows and export-ready lab notebook drafts.</p>
          </div>
          <Link href="/dashboard/reaction/new" className="rounded-md bg-ink px-4 py-2 font-semibold text-paper">New Reaction</Link>
        </div>
        <LocalExperiments />
      </main>
    </AppShell>
  );
}
