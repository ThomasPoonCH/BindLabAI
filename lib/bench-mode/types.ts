export type BenchStatus = "Not started" | "In progress" | "Complete" | "Needs review";
export type SourceBadge = "Extracted from procedure" | "Deterministic calculation" | "User-confirmed" | "Lab-approved template" | "Demo assumption";
export type ReagentKey = "substrate" | "dmf" | "methylamine" | "hatu" | "dipea";

export interface ReagentPlan {
  key: ReagentKey;
  name: string;
  equivalents?: number;
  molecularWeight?: number;
  density?: number;
  plannedValue: number;
  unit: "mg" | "uL";
  source: SourceBadge;
}

export interface ExperimentPlan {
  title: string;
  substrateMolecularWeight: number;
  targetConcentrationM: number;
  temperature: string;
  durationSeconds: number;
  checkpoint: string;
  reagents: Record<ReagentKey, ReagentPlan>;
}

export interface ActualAddition {
  reagent: ReagentKey;
  value: number;
  unit: "mg" | "uL";
  confirmedAt: string;
}

export interface Deviation {
  id: string;
  reagent: ReagentKey;
  planned: number;
  actual: number;
  unit: string;
  percentDifference: number;
  consequence: string;
  needsReview: boolean;
}

export interface Observation {
  id: string;
  kind: string;
  note: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  category: "session" | "action" | "calculation" | "deviation" | "observation" | "analysis" | "decision";
  createdAt: string;
}

export type AnalyticalScenario = "product-dominant" | "partial-conversion" | "inconclusive";

export interface AnalyticalCheckpoint {
  scenario: AnalyticalScenario;
  observed: string[];
  simulated: true;
}

export interface NextAction {
  state: string;
  recommendation: string;
  reasons: string[];
  alternative?: string;
}

export interface UpdatedPlan {
  scaleFactor: number;
  substrateMmol: number;
  substrateMassMg: number;
  hatuMmol: number;
  hatuMassMg: number;
  methylamineMmol: number;
  methylamineMassMg: number;
  dipeaMmol: number;
  dipeaMassMg: number;
  dipeaVolumeUl: number;
  dmfVolumeUl: number;
  theoreticalProductMmol: number;
}

export interface BenchSession {
  startedAt: string;
  paused: boolean;
  ended: boolean;
  currentStep: number;
  confirmedSteps: number[];
  actuals: Partial<Record<ReagentKey, ActualAddition>>;
  updatedPlan: UpdatedPlan;
  keepOriginalScale: boolean;
  elapsedSeconds: number;
  timerRunning: boolean;
  observations: Observation[];
  checkpoint: AnalyticalCheckpoint;
  timeline: TimelineEvent[];
  selectedPipette: "0.5-10 uL" | "2-20 uL" | "20-200 uL";
  dipeaMode: "neat" | "stock";
  stockConcentrationM: number;
  proposedAmendmentSaved: boolean;
}

export type BenchAction =
  | { type: "SET_ACTUAL"; reagent: ReagentKey; value: number }
  | { type: "CONFIRM_STEP"; step: number; event: string }
  | { type: "GO_TO_STEP"; step: number }
  | { type: "RECALCULATE"; substrateMassMg: number }
  | { type: "KEEP_ORIGINAL" }
  | { type: "TOGGLE_PAUSE" }
  | { type: "END_DEMO" }
  | { type: "TIMER_START" }
  | { type: "TIMER_PAUSE" }
  | { type: "TIMER_RESET" }
  | { type: "TIMER_TICK" }
  | { type: "JUMP_TO_CHECKPOINT" }
  | { type: "ADD_OBSERVATION"; kind: string; note: string }
  | { type: "SET_CHECKPOINT"; scenario: AnalyticalScenario }
  | { type: "SET_DIPEA_MODE"; mode: "neat" | "stock" }
  | { type: "SET_PIPETTE"; pipette: BenchSession["selectedPipette"] }
  | { type: "SAVE_AMENDMENT" }
  | { type: "RESTORE"; session: BenchSession }
  | { type: "LOAD_SCENARIO" }
  | { type: "RESET" };
