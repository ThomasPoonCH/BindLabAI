import { AppShell } from "@/components/AppShell";
import { NewExperimentWorkspace } from "./new-experiment-workspace";

export default function NewReactionWorkflowPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-6xl overflow-x-clip px-4 py-8 sm:px-5 lg:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">Universal reaction planning</p>
          <h1 className="mt-2 text-3xl font-semibold">New Experiment</h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/68">
            Start with a blank workspace for any chemistry or chemical-biology experiment, choose an optional template, or open a clearly labeled sample demo.
          </p>
        </div>
        <NewExperimentWorkspace />
      </main>
    </AppShell>
  );
}
