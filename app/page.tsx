import Link from "next/link";
import { ArrowRight, Check, ClipboardList, FlaskConical, Microscope } from "lucide-react";
import { HomeNavbar } from "@/components/HomeNavbar";
import { Reveal } from "@/components/Reveal";

const workflowStages = [
  { number: "01", title: "Build", copy: "Import a paper, PDF, reaction scheme or supervisor instruction into one structured experiment record.", icon: ClipboardList },
  { number: "02", title: "Verify", copy: "Confirm sources while deterministic engines check mass, mmol, equivalents, concentration and solvent volume.", icon: Check },
  { number: "03", title: "Execute", copy: "Follow live bench steps, record actual quantities and keep every deviation visible against the plan.", icon: FlaskConical },
  { number: "04", title: "Analyse & learn", copy: "Connect LCMS, HPLC, NMR, TLC or biological results to the experiment so the lab can troubleshoot and reuse it.", icon: Microscope }
];

export default function LandingPage() {
  return (
    <main className="bg-paper text-ink">
      <section className="lab-grid relative min-h-[760px] overflow-hidden border-b border-ink/10 lg:min-h-[860px]">
        <HomeNavbar />
        <div className="home-orbit home-orbit-outer pointer-events-none absolute -right-28 top-28 hidden h-[520px] w-[520px] rounded-full border border-copper/15 lg:block" />
        <div className="home-orbit home-orbit-inner pointer-events-none absolute -right-16 top-40 hidden h-[360px] w-[360px] rounded-full border border-moss/15 lg:block" />
        <div className="mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 pb-20 pt-36 sm:px-8 lg:min-h-[860px] lg:grid-cols-[1.02fr_0.98fr] lg:px-14">
          <Reveal className="relative z-10 max-w-3xl" eager>
            <div className="mb-7 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.28em] text-copper">
              <span className="h-px w-12 bg-copper" />
              AI experiment execution
            </div>
            <h1 className="max-w-4xl text-[clamp(3.1rem,6vw,6.8rem)] font-semibold leading-[0.93] tracking-[-0.055em]">
              From idea to bench-ready experiment in one minute.
            </h1>
            <p className="mt-9 max-w-2xl text-lg leading-8 text-ink/65 sm:text-xl">
              BindLab is the AI experiment execution and memory platform for chemistry and chemical-biology labs. We turns supervisor instructions, papers and reaction schemes into a checked workflow that scientists can execute, analyse and reuse.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/dashboard/reaction/new" className="group inline-flex items-center gap-3 rounded-md bg-ink px-6 py-4 text-sm font-semibold text-paper shadow-soft transition duration-500 hover:-translate-y-1 hover:bg-ink/90">
                Build an Experiment <ArrowRight size={17} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <Link href="/dashboard/bench-mode-demo" className="inline-flex items-center gap-3 border-b border-copper/60 px-1 py-3 text-sm font-semibold text-ink transition hover:border-ink">
                Experience Live Bench Mode <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </Reveal>

          <Reveal className="relative z-10 lg:pt-20" delay={180} eager>
            <div className="float-slow relative mx-auto max-w-[540px] rounded-[1.25rem] border border-ink/12 bg-white/80 p-3 shadow-soft backdrop-blur-sm">
              <div className="rounded-[0.9rem] border border-ink/10 bg-paper/70 p-6 sm:p-8">
                <div className="flex items-start justify-between border-b border-ink/10 pb-6">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-copper">One input. One auditable experiment.</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Build. Verify. Execute. Learn.</p>
                  </div>
                  <FlaskConical className="text-copper" size={28} strokeWidth={1.3} />
                </div>
                <div className="mt-7 space-y-3">
                  {["Structure papers, schemes or messages", "Calculate quantities outside the LLM", "Guide execution and capture actuals", "Connect results to reusable memory"].map((item, index) => (
                    <div key={item} className="home-state-row flex items-center gap-4 rounded-lg border border-ink/10 bg-white/80 px-4 py-4 text-sm text-ink/70" style={{ animationDelay: `${index * 700}ms` }}>
                      <span className="home-state-dot h-2 w-2 shrink-0 rounded-full bg-copper" />
                      <span className="font-mono text-xs text-copper">0{index + 1}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3 border-t border-ink/10 pt-6 text-xs uppercase tracking-[0.16em] text-ink/50">
                  <span>AI structures</span>
                  <span className="text-right">Scientists decide</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px shine-line" />
      </section>

      <section
        id="about"
        className="w-full bg-cover bg-center bg-no-repeat text-paper"
        style={{
          backgroundImage:
            "linear-gradient(rgba(45, 49, 49, 0.70), rgba(45, 49, 49, 0.70)), url('/home-page-background.png')",
        }}
      >
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
          <Reveal>
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">The hidden risk</p>
                <h2 className="mt-6 max-w-md text-4xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-5xl">The hidden risk starts before the bench.</h2>
              </div>
              <div className="max-w-3xl lg:pt-2">
                <p className="text-xl leading-9 text-paper/80">Researchers turn papers, messages, schemes and spreadsheets into quantities, order of addition, bench steps and analysis plans by hand. This pre-bench conversion is fragmented, hard to audit and easy to get wrong.</p>
                <div className="mt-10 h-px w-full bg-paper/20" />
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {["Fragmented experimental input", "Error-prone manual preparation", "Disconnected analysis"].map((item, index) => <div key={item} className="border-l border-copper/35 pl-4"><span className="font-mono text-xs text-copper">0{index + 1}</span><p className="mt-2 text-sm font-semibold leading-6 text-paper/85">{item}</p></div>)}
                </div>
                <p className="mt-8 max-w-2xl text-sm font-semibold leading-7 text-paper/85">Existing ELNs document what researchers did. BindLab focuses on what the researcher should do next and whether the plan is calculation-ready.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="resources" className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
          <Reveal>
            <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">The solution</p>
                <h2 id="lab-guides" className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl">One input becomes a complete, auditable experiment.</h2>
              </div>
              <p className="max-w-sm text-base leading-7 text-ink/60">AI structures. Deterministic engines calculate. Scientists decide. Every confirmed action remains linked to one traceable record.</p>
            </div>
          </Reveal>

          <div className="mt-16 grid gap-px overflow-hidden border border-ink/10 bg-ink/10 md:grid-cols-4">
            {workflowStages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <Reveal key={stage.number} delay={index * 100}>
                  <div className="group h-full bg-white p-6 transition duration-500 hover:bg-paper sm:p-8">
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-sm text-copper">{stage.number}</span>
                      <Icon className="text-moss transition duration-500 group-hover:-translate-y-1 group-hover:rotate-6" size={27} strokeWidth={1.4} />
                    </div>
                    <h3 className="mt-16 text-2xl font-semibold tracking-[-0.03em]">{stage.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-ink/60">{stage.copy}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
        <Reveal>
          <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">The product</p>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-5xl">Built for execution - not just answers or storage.</h2>
              <p className="mt-6 text-lg leading-8 text-ink/65">Generic AI explains. ELN and LIMS systems record. BindLab converts scientific intent into a checked, executable and learnable experiment loop.</p>
              <p className="mt-5 text-sm font-semibold leading-7 text-ink/72">One record can begin blank, from a template or from AI, then branch into reaction-specific execution and the analytical workflow the scientist actually needs.</p>
            </div>
            <div className="relative border border-ink/12 bg-white p-3 shadow-soft">
              <div className="border border-ink/10 bg-paper p-5 sm:p-8">
                <div className="flex items-center justify-between border-b border-ink/10 pb-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-ink/55">Experiment workspace</span>
                  <span className="h-2 w-2 rounded-full bg-moss shadow-[0_0_0_5px_rgba(70,98,74,0.12)]" />
                </div>
                <div className="mt-6 grid gap-3">
                  {["Structured experiment input", "Deterministic calculation checks", "Planned-versus-actual execution", "Adaptive analysis workflow", "Provenance-linked experiment memory"].map((item, index) => (
                    <div key={item} className="flex items-center justify-between border-b border-ink/10 py-4 text-sm">
                      <span className="text-ink/70">{item}</span>
                      <span className="font-mono text-xs text-copper">{["BUILT", "VERIFIED", "LIVE", "LINKED", "SAVED"][index]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex items-center justify-between rounded-md bg-ink px-4 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-paper">
                  <span>Traceable record</span><span>↗</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="overflow-hidden border-y border-ink/10 bg-white">
        <div className="home-memory-track flex w-max items-center py-5 text-xs font-semibold uppercase tracking-[0.22em] text-ink/48">
          {[0, 1].map(copy => <div key={copy} className="flex items-center">
            {["Scientific intent", "Structured record", "Deterministic checks", "Live execution", "Analytical result", "Reusable memory"].map(item => <div key={`${copy}-${item}`} className="flex items-center"><span className="mx-7 whitespace-nowrap">{item}</span><span className="h-1.5 w-1.5 rounded-full bg-copper" /></div>)}
          </div>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-14 lg:py-28">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">Built now. Prove next.</p>
              <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-5xl">Progress measured by reliability - not feature count.</h2>
            </div>
            <div className="grid gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-3">
              {[
                ["Built now", "Calculator-first prototype, universal reaction workspace, Live Bench Mode demo and local experiment records."],
                ["Next validation", "Benchmark calculation correctness, task completion, protocol clarity, trust and repeat usage with pilot labs."],
                ["Evidence gate", "Interviews, Hong Kong pilot workflows and willingness-to-pay conversations - without unproven accuracy claims."]
              ].map(([title, copy], index) => <div key={title} className="bg-white p-6"><span className="font-mono text-xs text-copper">0{index + 1}</span><h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-ink/60">{copy}</p></div>)}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-ink/10 bg-ink text-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-copper">From intent to execution</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Turn fragmented instructions into a checked, traceable experiment.</h2>
          </div>
          <Link href="/dashboard/reaction/new" className="group inline-flex shrink-0 items-center gap-3 rounded-md bg-paper px-6 py-4 text-sm font-semibold text-ink transition duration-500 hover:-translate-y-1 hover:bg-white">
            Build an Experiment <ArrowRight size={17} className="transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
      <div id="contact" className="sr-only">Contact</div>
    </main>
  );
}
