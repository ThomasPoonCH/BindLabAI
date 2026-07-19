"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Pipette } from "lucide-react";
import { actualEquivalents, calculateStockPlan, round, updatedValue } from "@/lib/bench-mode/calculations";
import { benchSteps, demoPlan } from "@/lib/bench-mode/demo-data";
import type { BenchAction, BenchSession } from "@/lib/bench-mode/types";
import { BenchTimer } from "./bench-timer";

export function CurrentStepCard({ session, dispatch, onSubstrateDeviation }: { session: BenchSession; dispatch: React.Dispatch<BenchAction>; onSubstrateDeviation: (value: number) => void }) {
  const step = benchSteps[session.currentStep];
  const reagent = step.reagent;
  const planned = reagent ? demoPlan.reagents[reagent].plannedValue : null;
  const updated = reagent ? updatedValue(reagent, session.updatedPlan) : null;
  const [actual, setActual] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const stock = calculateStockPlan(session.updatedPlan, session.stockConcentrationM);

  useEffect(() => {
    setActual(reagent && session.actuals[reagent] ? String(session.actuals[reagent]?.value ?? "") : "");
    setConfirmed(session.confirmedSteps.includes(session.currentStep));
  }, [reagent, session.actuals, session.confirmedSteps, session.currentStep]);

  function continueStep() {
    if (!confirmed) return;
    const numeric = Number(actual);
    if (reagent && (!Number.isFinite(numeric) || numeric < 0)) return;
    if (reagent) dispatch({ type: "SET_ACTUAL", reagent, value: numeric });
    if (reagent === "substrate" && Math.abs(numeric - 20) > 0.01) onSubstrateDeviation(numeric);
    dispatch({ type: "CONFIRM_STEP", step: session.currentStep, event: reagent ? `${numeric} ${demoPlan.reagents[reagent].unit} ${demoPlan.reagents[reagent].name} recorded` : `${step.title} confirmed` });
  }

  const actualEq = reagent && actual ? actualEquivalents(reagent, Number(actual), session.updatedPlan) : null;
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Current bench instruction</p><p className="mt-2 text-sm font-semibold text-ink/45">Step {session.currentStep + 1} of {benchSteps.length}</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">{step.title}</h2></div>
        <span className="rounded-full bg-mint/55 px-3 py-1.5 text-xs font-semibold text-moss">{step.source}</span>
      </div>
      <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">{step.explanation}</p>
      <div className="mt-6 rounded-md border border-ink/10 bg-paper/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">Destination vessel</p><p className="mt-1 font-semibold">{step.destination}</p>
      </div>

      {reagent && <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Quantity label="Planned" value={`${round(planned ?? 0, 2)} ${demoPlan.reagents[reagent].unit}`} />
        <Quantity label="Updated" value={`${round(updated ?? 0, 2)} ${demoPlan.reagents[reagent].unit}`} accent />
        <label className="rounded-md border border-ink/15 bg-white p-4"><span className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/45">Actual</span><div className="mt-2 flex items-center gap-2"><input aria-label={`Actual ${reagent}`} value={actual} onChange={event => setActual(event.target.value)} min="0" type="number" step="any" className="min-w-0 flex-1 border-b border-ink/20 bg-transparent py-1 text-xl font-semibold outline-none focus:border-moss" /><span className="text-sm font-semibold text-ink/55">{demoPlan.reagents[reagent].unit}</span></div></label>
      </div>}
      {actualEq !== null && <p className="mt-3 rounded-md bg-mint/35 px-4 py-3 text-sm"><strong>{round(actualEq, 2)} eq</strong> based on the current confirmed substrate scale.</p>}

      {reagent === "dipea" && <div className="mt-6 rounded-md border border-copper/25 bg-copper/5 p-5">
        <div className="flex items-start gap-3"><Pipette className="mt-0.5 shrink-0 text-copper" /><div><h3 className="font-semibold">Direct dispensing may be unreliable with the selected pipette.</h3><p className="mt-2 text-sm leading-6 text-ink/65">Calculated neat DIPEA: {round(session.updatedPlan.dipeaVolumeUl, 2)} uL. Selected pipette: {session.selectedPipette}. This is a feasibility simulation, not an autonomous instruction.</p></div></div>
        <select value={session.selectedPipette} onChange={event => dispatch({ type: "SET_PIPETTE", pipette: event.target.value as BenchSession["selectedPipette"] })} className="mt-4 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm">
          <option>0.5-10 uL</option><option>2-20 uL</option><option>20-200 uL</option>
        </select>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => dispatch({ type: "SET_DIPEA_MODE", mode: "neat" })} className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold">Use neat DIPEA</button><button type="button" onClick={() => dispatch({ type: "SET_DIPEA_MODE", mode: "stock" })} className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper">Build stock-solution plan</button><button type="button" className="rounded-md border border-copper/25 px-3 py-2 text-sm font-semibold text-copper">Request review</button></div>
        {session.dipeaMode === "stock" && <div className="mt-4 grid gap-3 rounded-md bg-white p-4 text-sm sm:grid-cols-2"><p><span className="text-ink/50">Demo stock</span><br /><strong>{stock.concentrationM} M</strong></p><p><span className="text-ink/50">Stock volume</span><br /><strong>{round(stock.stockVolumeUl, 1)} uL</strong></p><p><span className="text-ink/50">Effect on solvent</span><br /><strong>+{round(stock.additionalSolventUl, 1)} uL</strong></p><p><span className="text-ink/50">Projected concentration</span><br /><strong>{round(stock.projectedConcentrationM, 3)} M</strong></p></div>}
      </div>}

      {session.currentStep === 6 && <div className="mt-6"><BenchTimer session={session} dispatch={dispatch} /></div>}
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border border-ink/10 p-4">
        <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-[#46624a]" />
        <span><strong className="block">Researcher confirmation</strong><span className="mt-1 block text-sm text-ink/58">I have reviewed this demo action and the recorded value.</span></span>
      </label>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" disabled={session.currentStep === 0} onClick={() => dispatch({ type: "GO_TO_STEP", step: session.currentStep - 1 })} className="inline-flex min-h-12 items-center gap-2 rounded-md border border-ink/15 px-5 font-semibold disabled:opacity-35"><ArrowLeft size={17} /> Previous</button>
        <button type="button" disabled={!confirmed || Boolean(reagent && (!actual || Number(actual) < 0))} onClick={continueStep} className="inline-flex min-h-12 items-center gap-2 rounded-md bg-ink px-6 font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-35">{session.currentStep === 9 ? "Complete checkpoint" : "Confirm and continue"} <ArrowRight size={17} /></button>
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-xs text-ink/45"><Info size={13} /> BindLab records confirmed inputs; it does not independently authorize bench work.</p>
    </section>
  );
}

function Quantity({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`rounded-md border p-4 ${accent ? "border-moss/20 bg-mint/45" : "border-ink/10 bg-paper/55"}`}><p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/45">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>;
}
