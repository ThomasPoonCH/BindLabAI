import { X } from "lucide-react";
import { buildDeviations, round } from "@/lib/bench-mode/calculations";
import { demoPlan } from "@/lib/bench-mode/demo-data";
import type { BenchSession, NextAction } from "@/lib/bench-mode/types";

export function ExperimentReplay({ session, action, onClose }: { session: BenchSession; action: NextAction; onClose: () => void }) {
  const deviations = buildDeviations(demoPlan, session);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label="Experiment replay" className="mx-auto my-8 w-full max-w-5xl rounded-lg bg-paper p-5 shadow-soft sm:p-7">
        <div className="flex justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Experiment replay</p><h2 className="mt-2 text-2xl font-semibold">{demoPlan.title}</h2></div><button aria-label="Close replay" type="button" onClick={onClose} className="h-fit rounded-md border border-ink/10 p-2"><X size={18} /></button></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Replay title="Original plan"><p>20.0 mg substrate · 1.20 eq HATU · 1.30 eq methylamine hydrochloride · 4.00 eq DIPEA · 0.130 M in DMF.</p></Replay>
          <Replay title="Actual execution">{Object.values(session.actuals).length ? Object.values(session.actuals).map(item => item && <p key={item.reagent} className="capitalize">{item.reagent}: {round(item.value, 2)} {item.unit}</p>) : <p>No actual quantities recorded.</p>}</Replay>
          <Replay title="Deviations">{deviations.length ? deviations.map(item => <p key={item.id}>{item.reagent}: {round(item.percentDifference, 1)}% · {item.consequence}</p>) : <p>No deviations recorded.</p>}</Replay>
          <Replay title="Observations">{session.observations.length ? session.observations.map(item => <p key={item.id}>{item.kind}{item.note ? ` — ${item.note}` : ""}</p>) : <p>No observations recorded.</p>}</Replay>
          <Replay title="Analytical checkpoint"><p className="capitalize">{session.checkpoint.scenario.replaceAll("-", " ")}</p>{session.checkpoint.observed.map(item => <p key={item}>{item}</p>)}</Replay>
          <Replay title="Proposed next action"><p><strong>{action.state}</strong></p><p>{action.recommendation}</p>{session.proposedAmendmentSaved && <p className="mt-2 font-semibold text-copper">0.5x amendment saved as proposed, not executed.</p>}</Replay>
        </div>
      </section>
    </div>
  );
}

function Replay({ title, children }: { title: string; children: React.ReactNode }) { return <article className="rounded-md border border-ink/10 bg-white p-5"><h3 className="font-semibold">{title}</h3><div className="mt-3 space-y-2 text-sm leading-6 text-ink/65">{children}</div></article>; }
