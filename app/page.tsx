import Link from "next/link";
import { ArrowRight, ClipboardList, FlaskConical, Microscope, NotebookText } from "lucide-react";
import { HomeNavbar } from "@/components/HomeNavbar";

const workflowCards = [
  {
    title: "Reaction Calculator",
    copy: "Convert limiting reagent mass, molecular weight, equivalents, density, and stock concentration into exact planning quantities.",
    href: "/dashboard/reaction/new",
    icon: FlaskConical
  },
  {
    title: "Protocol Generator",
    copy: "Generate a practical step-by-step draft protocol from the entered reaction plan and calculated reagent table.",
    href: "/dashboard/reaction/new",
    icon: ClipboardList
  },
  {
    title: "LCMS Assistant",
    copy: "Prepare expected adduct masses, observed m/z matching, and sample dilution notes before analytical submission.",
    href: "/dashboard/reaction/new",
    icon: Microscope
  },
  {
    title: "Experiment Records",
    copy: "Save structured experiment data locally and export reagent tables, protocols, and review-ready records.",
    href: "/dashboard/experiments",
    icon: NotebookText
  }
];

export default function LandingPage() {
  return (
    <main className="bg-paper text-ink">
      <section className="lab-grid relative border-b border-ink/10">
        <HomeNavbar />
        <div className="mx-auto grid min-h-[78vh] max-w-6xl content-center gap-10 px-4 pb-16 pt-28 sm:px-6 md:pt-32 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-copper">BindLab AI Lab Workflow</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
              AI Lab Workflow Platform for Chemistry &amp; Chemical Biology
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72">
              Turn reaction plans, reagent tables, and molecular data into accurate calculations, step-by-step protocols, LCMS preparation, safety checks, and exportable lab records.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard/reaction/new"
                className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 font-semibold text-paper shadow-soft hover:bg-ink/90"
              >
                Start New Reaction
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white/75 px-5 py-3 font-semibold text-ink hover:bg-white"
              >
                View Demo Workflow
              </Link>
            </div>
          </div>
          <div className="self-end rounded-md border border-ink/10 bg-white/88 p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink/70">Demo workflow output</span>
              <FlaskConical size={18} className="text-copper" />
            </div>
            <div className="space-y-3 text-sm">
              {[
                "Calculate: 65 mg / 411.457 g/mol = 0.158 mmol.",
                "Plan: reagent masses, liquid volumes, and solvent volume.",
                "Prepare: LCMS adducts, sample dilution, protocol, and export."
              ].map((item) => (
                <div key={item} className="rounded-md border border-ink/10 bg-paper px-4 py-3">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">Problem</p>
          <h2 className="mt-3 text-3xl font-semibold">Pre-bench chemistry work is still fragmented.</h2>
          <p className="mt-4 text-lg leading-8 text-ink/72">
            Chemistry students and junior researchers often receive reaction schemes, reagent tables, or literature procedures, but still struggle to convert them into exact masses, volumes, concentrations, addition order, LCMS sample preparation, and lab notebook documentation. BindLab turns this preparation process into a structured, checked, and exportable workflow.
          </p>
        </div>
      </section>

      <section id="resources" className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper">Product</p>
          <h2 id="lab-guides" className="mt-2 text-3xl font-semibold">One complete reaction-to-record workflow</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflowCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="rounded-md border border-ink/10 p-5 transition hover:-translate-y-0.5 hover:border-moss/40 hover:shadow-sm">
                  <span className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-mint text-moss"><Icon size={20} /></span>
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink/68">{card.copy}</p>
                </Link>
              );
            })}
          </div>
          <div id="contact" className="sr-only">Contact</div>
        </div>
      </section>
    </main>
  );
}
