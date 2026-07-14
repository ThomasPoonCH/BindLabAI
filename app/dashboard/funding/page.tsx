import { AppShell } from "@/components/AppShell";

const points = [
  ["Problem", "Chemistry learners and junior researchers lose time translating fragmented protocols into safe, executable work."],
  ["Solution", "BindLab combines deterministic reaction calculators, missing-data checks, LCMS support, and AI-assisted protocol drafting."],
  ["Moat", "Scientific workflow structure, calculation auditability, lab-specific UX, and experiment memory."],
  ["Pilot Metric", "Reduction in prep time, fewer missing-data questions, improved protocol readiness, and calculator reuse."],
  ["Next Build", "Persistent experiment database, supervisor review links, document extraction, and LCMS result interpretation."]
];

export default function FundingOverviewPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">Competition narrative</p>
          <h1 className="mt-2 text-3xl font-semibold">Funding Overview</h1>
          <p className="mt-3 max-w-3xl leading-7 text-ink/68">
            BindLab is positioned as a scientific workflow SaaS for pre-bench preparation: calculations remain deterministic, while AI helps with explanation, protocol drafts, and notebook language.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {points.map(([title, copy]) => (
            <div key={title} className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 leading-7 text-ink/70">{copy}</p>
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
