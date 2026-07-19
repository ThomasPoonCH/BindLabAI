import { ArrowRight, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import type { NextAction } from "@/lib/bench-mode/types";

export function NextActionCard({ action, onAmendment, onContinue }: { action: NextAction; onAmendment: () => void; onContinue: () => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-ink/10 bg-ink text-paper shadow-soft">
      <div className="border-b border-paper/10 p-5"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#efb28f]"><Sparkles size={15} /> What happens next?</p><h2 className="mt-3 text-2xl font-semibold">{action.state}</h2></div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-paper/50">Recommended next action</p><p className="mt-2 text-lg font-semibold leading-7">{action.recommendation}</p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-paper/50">Why</p>
        <div className="mt-3 space-y-2">{action.reasons.map(reason => <p key={reason} className="flex items-start gap-2 text-sm leading-6 text-paper/72"><CheckCircle2 size={15} className="mt-1 shrink-0 text-[#9fc5aa]" /> {reason}</p>)}</div>
        {action.alternative && <div className="mt-5 rounded-md border border-[#efb28f]/25 bg-[#efb28f]/8 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#efb28f]"><ShieldAlert size={14} /> Requires supervisor approval</p><p className="mt-2 text-sm">{action.alternative}</p></div>}
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={onContinue} className="inline-flex min-h-11 items-center justify-between rounded-md bg-paper px-4 font-semibold text-ink">Continue and start timer <ArrowRight size={16} /></button>
          <button type="button" className="min-h-11 rounded-md border border-paper/15 px-4 text-left text-sm font-semibold">Prepare next LCMS sample</button>
          <button type="button" onClick={onAmendment} className="min-h-11 rounded-md border border-[#efb28f]/45 px-4 text-left text-sm font-semibold text-[#efb28f]">Build amendment simulation</button>
          <button type="button" className="min-h-11 rounded-md px-4 text-left text-sm font-semibold text-paper/65">Request supervisor review</button>
        </div>
      </div>
    </section>
  );
}
