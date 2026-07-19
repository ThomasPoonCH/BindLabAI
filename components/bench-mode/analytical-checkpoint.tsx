import { CheckCircle2, Microscope } from "lucide-react";
import type { AnalyticalScenario, BenchAction, BenchSession } from "@/lib/bench-mode/types";

const scenarios: { value: AnalyticalScenario; label: string }[] = [
  { value: "product-dominant", label: "Product dominant" },
  { value: "partial-conversion", label: "Product and starting material both detected" },
  { value: "inconclusive", label: "Inconclusive result" }
];

export function AnalyticalCheckpoint({ session, dispatch }: { session: BenchSession; dispatch: React.Dispatch<BenchAction> }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2"><Microscope className="text-moss" size={19} /><h2 className="font-semibold">LCMS checkpoint</h2></div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-copper">Simulated analytical input</p>
      <div className="mt-4 space-y-2">{scenarios.map(item => <label key={item.value} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${session.checkpoint.scenario === item.value ? "border-moss/35 bg-mint/45" : "border-ink/10"}`}><input type="radio" checked={session.checkpoint.scenario === item.value} onChange={() => dispatch({ type: "SET_CHECKPOINT", scenario: item.value })} className="mt-1 accent-[#46624a]" /><span className="font-semibold">{item.label}</span></label>)}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-md bg-paper p-4"><p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Expected</p><p className="mt-2 text-sm">Product signal placeholder<br />Starting-material signal placeholder</p></div>
        <div className="rounded-md bg-mint/35 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-moss">Observed</p>{session.checkpoint.observed.map(item => <p key={item} className="mt-2 flex items-center gap-2 text-sm"><CheckCircle2 size={14} /> {item}</p>)}</div>
      </div>
    </section>
  );
}
