import { Activity, Clock3, FlaskConical, Thermometer } from "lucide-react";
import { currentConcentration, round } from "@/lib/bench-mode/calculations";
import { benchSteps, demoPlan } from "@/lib/bench-mode/demo-data";
import type { BenchSession, BenchStatus } from "@/lib/bench-mode/types";

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function ExperimentStateCard({ session, deviationCount }: { session: BenchSession; deviationCount: number }) {
  const stages: { label: string; status: BenchStatus }[] = [
    { label: "Materials", status: session.currentStep < 1 ? "In progress" : session.currentStep < 6 ? "In progress" : "Complete" },
    { label: "Conditions", status: session.currentStep < 2 ? "Not started" : session.currentStep < 7 ? "In progress" : "Complete" },
    { label: "Execution", status: session.currentStep < 6 ? "Not started" : session.currentStep < 9 ? "In progress" : "Complete" },
    { label: "Analysis", status: session.currentStep < 9 ? "Not started" : "In progress" }
  ];
  const substrateMass = session.actuals.substrate?.value ?? session.updatedPlan.substrateMassMg;
  const stateItems = [
    ["Current step", `${session.currentStep + 1}. ${benchSteps[session.currentStep].title}`],
    ["Time elapsed", formatTime(session.elapsedSeconds)],
    ["Actual substrate", `${round(substrateMass, 2)} mg`],
    ["Actual substrate amount", `${round(session.updatedPlan.substrateMmol, 4)} mmol`],
    ["Current total volume", `${round(session.actuals.dmf?.value ?? session.updatedPlan.dmfVolumeUl, 1)} uL`],
    ["Estimated concentration", `${round(currentConcentration(session), 3)} M`],
    ["Temperature", demoPlan.temperature],
    ["Deviations", String(deviationCount)]
  ];
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Live experiment state</p><h2 className="mt-2 text-xl font-semibold">{demoPlan.title}</h2></div><Activity className="text-moss" /></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {stateItems.map(([label, value], index) => <div key={label} className="flex min-w-0 items-start justify-between gap-3 border-b border-ink/8 pb-3 text-sm"><span className="text-ink/55">{label}</span><strong className="max-w-[60%] break-words text-right font-semibold">{value}</strong>{index === -1 && <Clock3 />}</div>)}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-md bg-mint/45 px-4 py-3 text-sm"><span className="inline-flex items-center gap-2 font-semibold"><FlaskConical size={16} /> LCMS checkpoint</span><span>{session.elapsedSeconds >= demoPlan.durationSeconds ? "Reached" : "Pending"}</span></div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {stages.map(({ label, status }) => <div key={label} className="rounded-md border border-ink/10 p-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${status === "Complete" ? "bg-moss" : status === "In progress" ? "bg-copper" : "bg-ink/20"}`} /><span className="text-xs font-semibold">{label}</span></div><p className="mt-1 text-[11px] text-ink/50">{status}</p></div>)}
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-xs text-ink/48"><Thermometer size={14} /> All displayed quantities are fictional demo values.</p>
    </section>
  );
}
