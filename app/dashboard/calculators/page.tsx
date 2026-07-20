import { AppShell } from "@/components/AppShell";
import { calculatorDefinitions } from "@/lib/calculators/registry";
import { CalculatorWorkbench } from "./workbench";

const categories = ["General Chemistry", "Organic Synthesis", "LCMS / HPLC", "Lab Practical Tools"] as const;

export default async function CalculatorsPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const { projectId } = await searchParams;

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="lab-grid mb-8 overflow-hidden rounded-md border border-ink/10 bg-white/70 p-6 shadow-soft sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">BindLab Calculator Suite</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold sm:text-4xl">Transparent laboratory calculations, from units to preparation.</h1>
          <p className="mt-4 max-w-3xl leading-7 text-ink/68">
            Deterministic calculation tools show units, formulas, assumptions, and practical preparation guidance. AI can recommend tools, but it never performs the underlying arithmetic.
          </p>
        </div>
        <p className="mb-8 rounded-md border border-copper/20 bg-white px-4 py-3 text-sm leading-6 text-ink/70">
          BindLab provides calculation and workflow support. Users must verify quantities, units, hazards, SDS information and laboratory procedures before execution.
        </p>

        <CalculatorWorkbench projectId={projectId ?? null} />

        <div className="mt-10 grid gap-6">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="text-xl font-semibold">{category}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {calculatorDefinitions.filter((calculator) => calculator.category === category).map((calculator) => (
                  <div key={calculator.id} className="rounded-md border border-ink/10 bg-white p-4 shadow-sm">
                    <h3 className="font-semibold">{calculator.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/65">{calculator.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
