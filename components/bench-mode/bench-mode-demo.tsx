"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { RotateCcw, Save, X } from "lucide-react";
import { buildDeviations, round } from "@/lib/bench-mode/calculations";
import { demoPlan, initialBenchSession } from "@/lib/bench-mode/demo-data";
import { nextActionFor } from "@/lib/bench-mode/decision-rules";
import { benchReducer } from "@/lib/bench-mode/reducer";
import { clearBenchSession, loadBenchSession, saveBenchSession } from "@/lib/bench-mode/storage";
import type { Deviation } from "@/lib/bench-mode/types";
import { AmendmentSimulation } from "./amendment-simulation";
import { AnalyticalCheckpoint } from "./analytical-checkpoint";
import { BenchModeHeader } from "./bench-mode-header";
import { CurrentStepCard } from "./current-step-card";
import { DeviationsPanel } from "./deviation-card";
import { ExperimentReplay } from "./experiment-replay";
import { ExperimentStateCard } from "./experiment-state-card";
import { ExperimentTimeline } from "./experiment-timeline";
import { NextActionCard } from "./next-action-card";
import { ObservationsPanel } from "./observations-panel";

export function BenchModeDemo() {
  const [session, dispatch] = useReducer(benchReducer, undefined, initialBenchSession);
  const [hydrated, setHydrated] = useState(false);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [pendingSubstrate, setPendingSubstrate] = useState<number | null>(null);
  const [showAmendment, setShowAmendment] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [toast, setToast] = useState("");
  const skipInitialSave = useRef(true);
  const deviations = useMemo(() => buildDeviations(demoPlan, session), [session]);
  const nextAction = useMemo(() => nextActionFor(session.checkpoint.scenario, session), [session]);
  const progress = ((session.confirmedSteps.length + (session.currentStep === 9 ? 1 : 0)) / 10) * 100;

  useEffect(() => {
    setResumeAvailable(Boolean(loadBenchSession()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipInitialSave.current) {
      skipInitialSave.current = false;
      return;
    }
    try { saveBenchSession(session); } catch { setToast("Bench changes have not been saved. Browser storage may be full or unavailable. Keep this page open and try again."); }
  }, [hydrated, session]);

  useEffect(() => {
    if (!session.timerRunning) return;
    const timer = window.setInterval(() => dispatch({ type: "TIMER_TICK" }), 1000);
    return () => window.clearInterval(timer);
  }, [session.timerRunning]);

  function revert(deviation: Deviation) {
    dispatch({ type: "SET_ACTUAL", reagent: deviation.reagent, value: deviation.planned });
    setToast(`${deviation.reagent} restored to the current planned value.`);
  }

  function recalculate(value: number) {
    dispatch({ type: "RECALCULATE", substrateMassMg: value });
    setPendingSubstrate(null);
    setToast("Remaining reagent quantities and solvent volume recalculated.");
  }

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center bg-paper text-sm font-semibold text-ink/55">Preparing Live Bench Mode...</div>;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BenchModeHeader session={session} progress={progress} dispatch={dispatch} />
      <main className="mx-auto w-full max-w-[1500px] overflow-x-clip px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Fictional amide-coupling demonstration</p><p className="mt-1 text-sm text-ink/58">A live computational record of plan, execution, deviations, analysis, and justified next actions.</p></div>
          <div className="flex flex-wrap gap-2">
            {resumeAvailable && <button type="button" onClick={() => { const stored = loadBenchSession(); if (stored) { dispatch({ type: "RESTORE", session: stored }); setToast("Saved bench session restored."); } }} className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold"><Save size={15} /> Resume Session</button>}
            <button type="button" onClick={() => dispatch({ type: "LOAD_SCENARIO" })} className="rounded-md border border-moss/25 bg-mint/40 px-3 py-2 text-sm font-semibold text-moss">Load Demo Scenario</button>
            <button type="button" onClick={() => { clearBenchSession(); dispatch({ type: "RESET" }); setResumeAvailable(false); }} className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold"><RotateCcw size={15} /> Reset Demo</button>
          </div>
        </div>

        {toast && <div role="status" className="mb-5 flex items-center justify-between rounded-md border border-moss/20 bg-mint/55 px-4 py-3 text-sm font-semibold text-moss"><span>{toast}</span><button type="button" aria-label="Dismiss message" onClick={() => setToast("")}><X size={16} /></button></div>}
        {session.ended && <div className="mb-5 rounded-md border border-copper/25 bg-copper/5 p-4 text-sm font-semibold text-copper">Demo session ended. The local replay remains available; reset to begin again.</div>}

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(440px,1.45fr)] xl:grid-cols-[minmax(240px,0.78fr)_minmax(500px,1.38fr)_minmax(280px,0.9fr)]">
          <div className="min-w-0 space-y-5">
            <ExperimentStateCard session={session} deviationCount={deviations.length} />
            <DeviationsPanel deviations={deviations} onRecalculate={() => setPendingSubstrate(session.actuals.substrate?.value ?? session.updatedPlan.substrateMassMg)} onRevert={revert} />
          </div>
          <div className="min-w-0 space-y-5">
            <CurrentStepCard session={session} dispatch={dispatch} onSubstrateDeviation={setPendingSubstrate} />
            <ObservationsPanel observations={session.observations} dispatch={dispatch} />
            <AnalyticalCheckpoint session={session} dispatch={dispatch} />
          </div>
          <div className="min-w-0 space-y-5 lg:col-span-2 xl:col-span-1">
            <NextActionCard action={nextAction} onAmendment={() => setShowAmendment(true)} onContinue={() => dispatch({ type: "TIMER_START" })} />
            <ExperimentTimeline events={session.timeline} onReplay={() => setShowReplay(true)} />
          </div>
        </div>
      </main>

      {pendingSubstrate !== null && <ScaleModal actual={pendingSubstrate} onRecalculate={() => recalculate(pendingSubstrate)} onKeep={() => { dispatch({ type: "KEEP_ORIGINAL" }); setPendingSubstrate(null); }} onCancel={() => setPendingSubstrate(null)} />}
      {showAmendment && <AmendmentSimulation session={session} dispatch={dispatch} onClose={() => setShowAmendment(false)} />}
      {showReplay && <ExperimentReplay session={session} action={nextAction} onClose={() => setShowReplay(false)} />}
    </div>
  );
}

function ScaleModal({ actual, onRecalculate, onKeep, onCancel }: { actual: number; onRecalculate: () => void; onKeep: () => void; onCancel: () => void }) {
  const difference = ((actual - 20) / 20) * 100;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label="Recalculate remaining quantities" className="w-full max-w-lg rounded-lg bg-paper p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Scale deviation detected</p>
        <h2 className="mt-3 text-2xl font-semibold">Actual substrate is {round(Math.abs(difference), 1)}% {difference >= 0 ? "above" : "below"} plan.</h2>
        <p className="mt-3 leading-7 text-ink/65">Recalculate all remaining quantities to the actual scale? The original immutable plan will remain available in the replay.</p>
        <div className="mt-6 grid gap-2"><button type="button" onClick={onRecalculate} className="rounded-md bg-ink px-4 py-3 font-semibold text-paper">Recalculate remaining quantities</button><button type="button" onClick={onKeep} className="rounded-md border border-ink/15 px-4 py-3 font-semibold">Keep original quantities</button><button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-semibold text-ink/55">Cancel</button></div>
      </section>
    </div>
  );
}
