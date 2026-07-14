import { AppShell } from "@/components/AppShell";
import { CalculatorWorkbench } from "../calculators/workbench";

export default function DilutionCalculatorPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">Deterministic calculator</p>
          <h1 className="mt-2 text-3xl font-semibold">Dilution Calculator</h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/68">
            Professional dilution and recipe calculations. Arithmetic is handled by deterministic TypeScript functions, not AI.
          </p>
        </div>
        <CalculatorWorkbench projectId={null} />
      </main>
    </AppShell>
  );
}
