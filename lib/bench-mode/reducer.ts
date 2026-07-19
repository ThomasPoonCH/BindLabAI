import { calculatePlan } from "./calculations";
import { demoPlan, initialBenchSession, timelineEvent } from "./demo-data";
import type { BenchAction, BenchSession } from "./types";

function addEvent(state: BenchSession, label: string, category: Parameters<typeof timelineEvent>[1]) {
  return [...state.timeline, timelineEvent(label, category)];
}

export function benchReducer(state: BenchSession, action: BenchAction): BenchSession {
  switch (action.type) {
    case "SET_ACTUAL": {
      const unit = demoPlan.reagents[action.reagent].unit;
      return {
        ...state,
        actuals: { ...state.actuals, [action.reagent]: { reagent: action.reagent, value: Math.max(0, action.value), unit, confirmedAt: new Date().toISOString() } }
      };
    }
    case "CONFIRM_STEP":
      return {
        ...state,
        confirmedSteps: state.confirmedSteps.includes(action.step) ? state.confirmedSteps : [...state.confirmedSteps, action.step],
        currentStep: Math.min(action.step + 1, 9),
        timeline: addEvent(state, action.event, "action")
      };
    case "GO_TO_STEP":
      return { ...state, currentStep: Math.max(0, Math.min(9, action.step)) };
    case "RECALCULATE":
      return {
        ...state,
        updatedPlan: calculatePlan(demoPlan, action.substrateMassMg),
        keepOriginalScale: false,
        timeline: addEvent(state, `Remaining quantities recalculated to ${action.substrateMassMg.toFixed(1)} mg substrate`, "calculation")
      };
    case "KEEP_ORIGINAL":
      return { ...state, keepOriginalScale: true, timeline: addEvent(state, "Original planned quantities retained after substrate deviation", "deviation") };
    case "TOGGLE_PAUSE":
      return { ...state, paused: !state.paused, timerRunning: state.paused ? state.timerRunning : false };
    case "END_DEMO":
      return { ...state, ended: true, timerRunning: false, timeline: addEvent(state, "Demo session ended", "session") };
    case "TIMER_START":
      return { ...state, timerRunning: true, timeline: addEvent(state, "Reaction timer started", "action") };
    case "TIMER_PAUSE":
      return { ...state, timerRunning: false, timeline: addEvent(state, "Reaction timer paused", "action") };
    case "TIMER_RESET":
      return { ...state, timerRunning: false, elapsedSeconds: 0, timeline: addEvent(state, "Reaction timer reset", "action") };
    case "TIMER_TICK":
      return state.timerRunning && !state.paused ? { ...state, elapsedSeconds: Math.min(demoPlan.durationSeconds, state.elapsedSeconds + 1) } : state;
    case "JUMP_TO_CHECKPOINT":
      return { ...state, elapsedSeconds: demoPlan.durationSeconds, timerRunning: false, currentStep: 9, timeline: addEvent(state, "Jumped to simulated LCMS checkpoint", "analysis") };
    case "ADD_OBSERVATION": {
      const observation = { id: `${Date.now()}`, kind: action.kind, note: action.note, createdAt: new Date().toISOString() };
      return { ...state, observations: [...state.observations, observation], timeline: addEvent(state, `${action.kind} appearance recorded`, "observation") };
    }
    case "SET_CHECKPOINT":
      return { ...state, checkpoint: { ...state.checkpoint, scenario: action.scenario }, timeline: addEvent(state, `${action.scenario.replaceAll("-", " ")} scenario selected`, "analysis") };
    case "SET_DIPEA_MODE":
      return { ...state, dipeaMode: action.mode, timeline: addEvent(state, action.mode === "stock" ? "DIPEA stock-solution simulation opened" : "Neat DIPEA option retained", "calculation") };
    case "SET_PIPETTE":
      return { ...state, selectedPipette: action.pipette };
    case "SAVE_AMENDMENT":
      return { ...state, proposedAmendmentSaved: true, timeline: addEvent(state, "0.5x amendment saved as a proposed action", "decision") };
    case "RESTORE":
      return action.session;
    case "LOAD_SCENARIO": {
      const loaded = initialBenchSession();
      loaded.actuals = {
        substrate: { reagent: "substrate", value: 20.6, unit: "mg", confirmedAt: new Date().toISOString() },
        dmf: { reagent: "dmf", value: 850, unit: "uL", confirmedAt: new Date().toISOString() },
        hatu: { reagent: "hatu", value: 10.7, unit: "mg", confirmedAt: new Date().toISOString() }
      };
      loaded.updatedPlan = calculatePlan(demoPlan, 20.6);
      loaded.currentStep = 9;
      loaded.elapsedSeconds = demoPlan.durationSeconds;
      loaded.confirmedSteps = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      loaded.timeline = [
        ...loaded.timeline,
        timelineEvent("20.6 mg substrate recorded", "action"),
        timelineEvent("Remaining quantities recalculated", "calculation"),
        timelineEvent("0.85 mL DMF recorded", "deviation"),
        timelineEvent("10.7 mg HATU recorded", "deviation"),
        timelineEvent("Partial conversion scenario selected", "analysis"),
        timelineEvent("Next action generated", "decision")
      ];
      return loaded;
    }
    case "RESET":
      return initialBenchSession();
  }
}
