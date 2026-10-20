import { describe, expect, it } from "vitest";
import type { ExperimentRecord } from "@/lib/ai/experiment-schema";
import { blockingReasons, calculations, findConflicts, mergeDraft } from "./experiment-workflow";
import { parseStoredExperiments } from "./experiment-repository";

const record = (title = "Manual") => ({ experimentId: "one", title, objective: null, reactionType: null, experimentStatus: "draft", createdAt: "2026-01-01", updatedAt: "2026-01-01", originalInstruction: "", reagents: [], conditions: { solvent: null, solventVolume: null, solventVolumeUnit: "mL", targetConcentration: null, targetConcentrationUnit: "M", temperature: null, temperatureUnit: "C", duration: null, durationUnit: "h", atmosphere: null, vessel: null, vesselCapacity: null, vesselCapacityUnit: "mL", mixingMethod: null, orderOfAddition: [], provenance: { sourceType: "user_entered", sourceText: null, sourceReference: null, confidence: null, confirmedByUser: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" } }, workup: null, purification: null, analyticalMethods: [], expectedProduct: null, expectedMolecularWeight: null, notes: null, safetyNotes: [], missingInformation: [], conflicts: [], assumptions: [], warnings: [], aiSummary: null } as ExperimentRecord);
describe("canonical experiment workflow", () => {
  it("detects conflicts and blockers", () => { const a = record(); const b = record("AI"); expect(findConflicts(a, b)).toHaveLength(1); expect(blockingReasons(a)).toContain("Choose one limiting reagent."); });
  it("keeps a confirmed current value when requested", () => { const a = record("Manual"); const b = record("AI"); expect(mergeDraft(a, b, { title: "keep" }).title).toBe("Manual"); });
  it("uses AI value when explicitly selected", () => { const a = record("Manual"); const b = record("AI"); expect(mergeDraft(a, b, { title: "ai" }).title).toBe("AI"); });
  it("calculates mass to mmol deterministically", () => { const a = record(); a.reagents = [{ id: "r", name: "A", role: "reactant", physicalState: "solid", molecularWeight: 100, molecularWeightUnit: "g/mol", mass: 50, massUnit: "mg", amountMmol: null, equivalents: null, density: null, densityUnit: "g/mL", stockConcentration: null, stockConcentrationUnit: "M", volume: null, volumeUnit: null, isLimitingReagent: true, provenance: a.conditions.provenance }]; expect(calculations(a)[0].result).toContain("0.50000 mmol"); });
  it("filters malformed local records without dropping valid ones", () => { expect(parseStoredExperiments([record(), { nope: true }])).toHaveLength(1); });
  it("migrates older canonical records missing condition units", () => { const older = record() as unknown as { conditions: Record<string, unknown> }; delete older.conditions.solventVolumeUnit; delete older.conditions.targetConcentrationUnit; delete older.conditions.temperatureUnit; delete older.conditions.durationUnit; delete older.conditions.vesselCapacity; delete older.conditions.vesselCapacityUnit; expect(parseStoredExperiments([older])).toHaveLength(1); });
});

it("detects temperature and duration conflicts without replacing researcher values", () => {
  const current = record();
  current.conditions.temperature = "25";
  current.conditions.duration = "2";
  const incoming = record();
  incoming.conditions.temperature = "80";
  incoming.conditions.duration = "24";
  expect(findConflicts(current, incoming).map(c => c.field)).toEqual(expect.arrayContaining(["temperature", "duration"]));
  const merged = mergeDraft(current, incoming, { temperature: "keep", duration: "keep" });
  expect(merged.conditions.temperature).toBe("25");
  expect(merged.conditions.duration).toBe("2");
});
