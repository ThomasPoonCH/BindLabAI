import { AppShell } from "@/components/AppShell";

const segments = ["Chemistry students", "Junior research assistants", "Teaching labs", "Early biotech teams"];

export default function PilotSignupPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">Pilot program</p>
          <h1 className="mt-2 text-3xl font-semibold">Bring BindLab into a real lab workflow</h1>
          <p className="mt-4 max-w-3xl leading-7 text-ink/70">
            The pilot is designed to validate whether structured reaction planning, deterministic chemistry calculators, LCMS preparation, and AI-assisted notebook drafting reduce prep friction before bench work.
          </p>
        </section>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {segments.map((segment) => (
            <div key={segment} className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">{segment}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">Pilot interviews, sample workflows, and feedback on safety/missing-data checks.</p>
            </div>
          ))}
        </div>
        <form className="mt-6 grid gap-4 rounded-md border border-ink/10 bg-white p-5 shadow-sm">
          <input className="rounded-md border border-ink/15 px-3 py-2" placeholder="Name" />
          <input className="rounded-md border border-ink/15 px-3 py-2" placeholder="Email" />
          <textarea className="rounded-md border border-ink/15 px-3 py-2" rows={5} placeholder="What lab workflow should BindLab help with?" />
          <button type="button" className="w-fit rounded-md bg-ink px-4 py-2 font-semibold text-paper">Save pilot interest</button>
        </form>
      </main>
    </AppShell>
  );
}
