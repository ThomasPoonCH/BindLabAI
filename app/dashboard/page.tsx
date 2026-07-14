import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, listLocalProjects } from "@/lib/storage";
import { ArrowRight, Calculator, ClipboardCheck, FlaskConical, Microscope, Plus } from "lucide-react";

const workflowCards = [
  {
    title: "1. Reaction setup",
    copy: "Capture limiting reagent, equivalents, MW, solvent, concentration, temperature, and atmosphere.",
    href: "/dashboard/reaction/new",
    icon: FlaskConical
  },
  {
    title: "2. Deterministic calculations",
    copy: "Calculate mmol, masses, volumes, solvent amount, theoretical yield, and pipetting warnings.",
    href: "/dashboard/calculators",
    icon: Calculator
  },
  {
    title: "3. LCMS readiness",
    copy: "Prepare sample dilution, expected data, missing method fields, and analytical submission notes.",
    href: "/dashboard/lcms",
    icon: Microscope
  },
  {
    title: "4. Save and export",
    copy: "Store reaction exports locally and prepare supervisor-ready notebook text.",
    href: "/dashboard/experiments",
    icon: ClipboardCheck
  }
];

export default async function DashboardPage() {
  const projects = isSupabaseConfigured()
    ? (await createServiceSupabaseClient()
      .from("projects")
      .select("id,title,subject_area,user_level,preferred_language,created_at")
      .order("created_at", { ascending: false })
      .limit(20)).data
    : await listLocalProjects();

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <section className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">BindLab workflow cockpit</p>
              <h1 className="mt-2 text-3xl font-semibold">AI chemistry lab workflow MVP</h1>
              <p className="mt-3 max-w-3xl leading-7 text-ink/68">
                Demonstrate the full competition workflow: reaction entry, deterministic reagent quantities, missing data and safety checks, draft protocol generation, LCMS preparation, and experiment export.
              </p>
            </div>
            <Link href="/dashboard/reaction/new" className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-semibold text-paper">
              <Plus size={18} />
              New Reaction
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href} className="rounded-md border border-ink/10 bg-white p-5 shadow-sm transition hover:border-moss/40 hover:-translate-y-0.5">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-mint text-moss"><Icon size={20} /></span>
                <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">{card.copy}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-moss">Open <ArrowRight size={14} /></span>
              </Link>
            );
          })}
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Saved lab prep projects</h2>
            <p className="mt-2 text-ink/65">Existing AI guide projects are preserved for backwards compatibility.</p>
          </div>
          <Link href="/dashboard/new" className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 font-semibold text-paper">
            <Plus size={18} />
            Legacy Lab Prep
          </Link>
          </div>

          <div className="mt-8 grid gap-4">
          {projects?.length ? (
            projects.map((project) => (
              <Link key={project.id} href={`/dashboard/project/${project.id}`} className="rounded-md border border-ink/10 bg-white p-5 shadow-sm hover:border-moss/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{project.title}</h2>
                    <p className="mt-1 text-sm text-ink/65">
                      {project.subject_area} • {project.user_level} • {project.preferred_language}
                    </p>
                  </div>
                  <span className="text-sm text-ink/50">{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-ink/20 bg-white p-8 text-center">
              <h2 className="text-xl font-semibold">No lab prep projects yet</h2>
              <p className="mt-2 text-ink/65">Create your first guide from a supervisor message, protocol, or notes.</p>
            </div>
          )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
