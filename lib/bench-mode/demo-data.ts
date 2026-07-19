import { calculatePlan } from "./calculations";
import type { BenchSession, ExperimentPlan, TimelineEvent } from "./types";

export const demoPlan: ExperimentPlan = {
  title: "12-COOH to 12-NHMe Amide Coupling",
  substrateMolecularWeight: 450.5,
  targetConcentrationM: 0.13,
  temperature: "Room temperature",
  durationSeconds: 7200,
  checkpoint: "LCMS at 2 hours",
  reagents: {
    substrate: { key: "substrate", name: "12-COOH substrate", equivalents: 1, molecularWeight: 450.5, plannedValue: 20, unit: "mg", source: "Extracted from procedure" },
    dmf: { key: "dmf", name: "DMF", plannedValue: calculatePlanPlaceholder("dmf"), unit: "uL", source: "Deterministic calculation" },
    methylamine: { key: "methylamine", name: "Methylamine hydrochloride", equivalents: 1.3, molecularWeight: 67.52, plannedValue: calculatePlanPlaceholder("methylamine"), unit: "mg", source: "Extracted from procedure" },
    hatu: { key: "hatu", name: "HATU", equivalents: 1.2, molecularWeight: 380.23, plannedValue: calculatePlanPlaceholder("hatu"), unit: "mg", source: "Extracted from procedure" },
    dipea: { key: "dipea", name: "DIPEA", equivalents: 4, molecularWeight: 129.24, density: 0.742, plannedValue: calculatePlanPlaceholder("dipea"), unit: "uL", source: "Deterministic calculation" }
  }
};

function calculatePlanPlaceholder(key: "dmf" | "methylamine" | "hatu" | "dipea") {
  const mmol = 20 / 450.5;
  if (key === "dmf") return (mmol / 0.13) * 1000;
  if (key === "methylamine") return mmol * 1.3 * 67.52;
  if (key === "hatu") return mmol * 1.2 * 380.23;
  return (mmol * 4 * 129.24) / 0.742;
}

export const benchSteps = [
  { title: "Prepare reaction vial", explanation: "Prepare a dry 2 mL reaction vial and stir bar according to the approved local procedure.", destination: "2 mL reaction vial", source: "Lab-approved template" as const },
  { title: "Add 12-COOH substrate", explanation: "Record the actual substrate mass before the plan is scaled.", reagent: "substrate" as const, destination: "Reaction vial", source: "Extracted from procedure" as const },
  { title: "Add DMF", explanation: "Record the actual solvent volume. BindLab will estimate the resulting substrate concentration.", reagent: "dmf" as const, destination: "Reaction vial", source: "Deterministic calculation" as const },
  { title: "Add methylamine hydrochloride", explanation: "Confirm the actual mass dispensed.", reagent: "methylamine" as const, destination: "Reaction vial", source: "Extracted from procedure" as const },
  { title: "Add HATU", explanation: "Confirm the actual mass dispensed and review the resulting equivalents.", reagent: "hatu" as const, destination: "Reaction vial", source: "Extracted from procedure" as const },
  { title: "Add DIPEA", explanation: "Review practical dispensing feasibility before recording the actual volume.", reagent: "dipea" as const, destination: "Reaction vial", source: "Deterministic calculation" as const },
  { title: "Start reaction timer", explanation: "Start the planned two-hour timer after researcher confirmation.", destination: "Room-temperature reaction", source: "Extracted from procedure" as const },
  { title: "Record observations", explanation: "Capture appearance and any relevant bench note with a timestamp.", destination: "Experiment record", source: "User-confirmed" as const },
  { title: "Prepare LCMS sample", explanation: "Record sample collection according to the approved instrument and lab procedure.", destination: "LCMS vial", source: "Demo assumption" as const },
  { title: "Review analytical checkpoint", explanation: "Select the simulated analytical result that the demo should evaluate.", destination: "Analytical checkpoint", source: "Demo assumption" as const }
];

export function timelineEvent(label: string, category: TimelineEvent["category"]): TimelineEvent {
  return { id: `${Date.now()}-${Math.random()}`, label, category, createdAt: new Date().toISOString() };
}

export function initialBenchSession(): BenchSession {
  const now = new Date().toISOString();
  return {
    startedAt: now,
    paused: false,
    ended: false,
    currentStep: 0,
    confirmedSteps: [],
    actuals: {},
    updatedPlan: calculatePlan(demoPlan, 20),
    keepOriginalScale: false,
    elapsedSeconds: 0,
    timerRunning: false,
    observations: [],
    checkpoint: {
      scenario: "partial-conversion",
      observed: ["Product detected", "Starting material detected", "Unexpected major peak absent"],
      simulated: true
    },
    timeline: [{ id: "started", label: "Bench Mode started", category: "session", createdAt: now }],
    selectedPipette: "2-20 uL",
    dipeaMode: "neat",
    stockConcentrationM: 1,
    proposedAmendmentSaved: false
  };
}
