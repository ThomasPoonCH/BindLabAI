import { X } from "lucide-react";
import { calculateAmendment, round } from "@/lib/bench-mode/calculations";
import type { BenchAction, BenchSession } from "@/lib/bench-mode/types";

export function AmendmentSimulation({ session, dispatch, onClose }: { session: BenchSession; dispatch: React.Dispatch<BenchAction>; onClose: () => void }) {
  const rows = calculateAmendment(session.updatedPlan);
  const projectedVolume = (session.actuals.dmf?.value ?? session.updatedPlan.dmfVolumeUl) + rows.dipea.amount;
  const projectedConcentration = session.updatedPlan.substrateMmol / (projectedVolume / 1000);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label="Amendment simulation" className="my-8 w-full max-w-4xl rounded-lg bg-paper p-5 shadow-soft sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Deterministic simulation</p><h2 className="mt-2 text-2xl font-semibold">0.5x amendment plan</h2></div><button aria-label="Close amendment" type="button" onClick={onClose} className="rounded-md border border-ink/10 p-2"><X size={18} /></button></div>
        <p className="mt-4 rounded-md border border-copper/25 bg-copper/5 p-4 text-sm font-semibold text-copper">Simulation only. Amendment requires supervisor approval before execution.</p>
        <div className="mt-5 space-y-3">{Object.entries(rows).map(([name, row]) => <div key={name} className="grid gap-3 rounded-md border border-ink/10 bg-white p-4 sm:grid-cols-[1.2fr_repeat(4,1fr)]"><strong className="capitalize">{name}</strong><Cell label="Current" value={`${row.currentEq} eq`} /><Cell label="Proposed" value={`+${row.addEq} eq`} /><Cell label="Projected" value={`${row.totalEq} eq`} /><Cell label="Demo amount" value={`${round(row.amount, 2)} ${row.unit}`} /></div>)}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-md bg-mint/40 p-4"><p className="text-xs uppercase tracking-wide text-ink/45">Projected total volume</p><p className="mt-2 text-xl font-semibold">{round(projectedVolume, 1)} uL</p></div><div className="rounded-md bg-mint/40 p-4"><p className="text-xs uppercase tracking-wide text-ink/45">Projected concentration</p><p className="mt-2 text-xl font-semibold">{round(projectedConcentration, 3)} M</p></div></div>
        <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md border border-ink/15 px-4 py-3 font-semibold">Cancel</button><button type="button" className="rounded-md border border-copper/30 px-4 py-3 font-semibold text-copper">Send for approval</button><button type="button" onClick={() => { dispatch({ type: "SAVE_AMENDMENT" }); onClose(); }} className="rounded-md bg-ink px-4 py-3 font-semibold text-paper">Save as proposed action</button></div>
      </section>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) { return <div><p className="text-[11px] uppercase tracking-wide text-ink/42">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
