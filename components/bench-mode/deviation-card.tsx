import { AlertTriangle, RotateCcw, Scale } from "lucide-react";
import { round } from "@/lib/bench-mode/calculations";
import type { Deviation } from "@/lib/bench-mode/types";

export function DeviationsPanel({ deviations, onRecalculate, onRevert }: { deviations: Deviation[]; onRecalculate: () => void; onRevert: (deviation: Deviation) => void }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="font-semibold">Planned versus actual</h2><Scale size={18} className="text-copper" /></div>
      {deviations.length ? <div className="mt-4 space-y-3">{deviations.map(item => (
        <article key={item.id} className={`rounded-md border p-4 ${item.needsReview ? "border-copper/30 bg-copper/5" : "border-ink/10 bg-paper/60"}`}>
          <div className="flex items-start justify-between gap-3"><div><p className="font-semibold capitalize">{item.reagent}</p><p className="mt-1 text-xs text-ink/55">Planned {round(item.planned, 2)} {item.unit} · Actual {round(item.actual, 2)} {item.unit}</p></div><span className="rounded-full bg-white px-2 py-1 text-xs font-semibold">{item.percentDifference > 0 ? "+" : ""}{round(item.percentDifference, 1)}%</span></div>
          <p className="mt-3 text-sm leading-6 text-ink/68">{item.consequence}</p>
          {item.needsReview && <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-copper"><AlertTriangle size={13} /> Researcher review needed</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            {item.reagent === "substrate" && <button type="button" onClick={onRecalculate} className="rounded-md bg-ink px-3 py-2 text-paper">Recalculate remaining plan</button>}
            <button type="button" className="rounded-md border border-ink/15 px-3 py-2">Request supervisor review</button>
            <button type="button" onClick={() => onRevert(item)} className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-ink/55"><RotateCcw size={13} /> Revert entry</button>
          </div>
        </article>
      ))}</div> : <p className="mt-4 rounded-md bg-mint/35 p-4 text-sm text-ink/65">No confirmed quantity deviations yet.</p>}
    </section>
  );
}
