import { describe, expect, it } from "vitest";
import type { ExperimentRecord } from "@/lib/ai/experiment-schema";
import { calculateExperiment, theoreticalProduct } from "./experiment-calculations";

const timestamp = "2026-07-16T00:00:00.000Z";
const provenance = { sourceType: "user_entered" as const, sourceText: null, sourceReference: null, confidence: null, confirmedByUser: true, createdAt: timestamp, updatedAt: timestamp };
const record = (): ExperimentRecord => ({ experimentId: "fixture", title: "Fixture", objective: null, reactionType: null, experimentStatus: "draft", createdAt: timestamp, updatedAt: timestamp, originalInstruction: "", reagents: [{ id: "reference", name: "Substrate", role: "reactant", physicalState: "solid", molecularWeight: 100, molecularWeightUnit: "g/mol", mass: null, massUnit: "mg", amountMmol: null, equivalents: 1, density: null, densityUnit: "g/mL", stockConcentration: null, stockConcentrationUnit: "M", volume: null, volumeUnit: null, isLimitingReagent: true, inputValue: 10, inputUnit: "mg", purityPercent: null, provenance }, { id: "liquid", name: "Liquid reagent", role: "reagent", physicalState: "liquid", molecularWeight: 50, molecularWeightUnit: "g/mol", mass: null, massUnit: "mg", amountMmol: null, equivalents: 2, density: null, densityUnit: "g/mL", stockConcentration: null, stockConcentrationUnit: "M", volume: null, volumeUnit: null, isLimitingReagent: false, inputValue: null, inputUnit: null, purityPercent: 95, provenance }], conditions: { solvent: "DMF", solventVolume: null, solventVolumeUnit: "mL", targetConcentration: 0.1, targetConcentrationUnit: "M", temperature: null, temperatureUnit: "C", duration: null, durationUnit: "h", atmosphere: null, vessel: null, vesselCapacity: null, vesselCapacityUnit: "mL", mixingMethod: null, orderOfAddition: [], provenance }, workup: null, purification: null, analyticalMethods: [], expectedProduct: "Product", expectedMolecularWeight: 110, productStoichiometry: null, notes: null, safetyNotes: [], missingInformation: [], conflicts: [], assumptions: [], warnings: [], aiSummary: null });

describe("experiment calculation presentation", () => {
  it("provides auditable formula, substitution, and result strings", () => {
    const plan = calculateExperiment(record());
    const explanation = plan.rows.find(row => row.id === "liquid")?.explanations.find(item => item.label.includes("required amount"));
    expect(explanation?.formula).toContain("reference");
    expect(explanation?.substituted).toContain("x 2");
    expect(explanation?.result).toContain("umol");
  });
  it("keeps mass while warning that liquid volume needs density", () => {
    const plan = calculateExperiment(record());
    const liquid = plan.rows.find(row => row.id === "liquid");
    expect(liquid?.theoreticalMassMg).not.toBeNull();
    expect(liquid?.liquidVolumeUl).toBeNull();
    expect(liquid?.errors.join(" ")).toContain("density");
  });
  it("does not assume product stoichiometry", () => {
    expect(theoreticalProduct(record())).toBeNull();
    const confirmed = record(); confirmed.productStoichiometry = 1;
    expect(theoreticalProduct(confirmed)?.amountUmol).toBeCloseTo(100, 8);
  });
  it("keeps imported evidence but derives the planned amount from equivalents", () => {
    const imported = record();
    imported.reagents[1] = {
      ...imported.reagents[1],
      physicalState: "solid",
      molecularWeight: 50,
      equivalents: 0.5,
      mass: 999,
      massUnit: "mg",
      inputValue: 999,
      inputUnit: "mg",
      provenance: { ...provenance, sourceType: "imported_from_document" },
    };
    const calculated = calculateExperiment(imported).rows.find(row => row.id === "liquid");
    expect(imported.reagents[1].mass).toBe(999);
    expect(calculated?.amountUmol).toBeCloseTo(50, 8);
    expect(calculated?.theoreticalMassMg).toBeCloseTo(2.5, 8);
  });
  it("uses the displayed mass unit when an edited reference value has no stored input unit", () => {
    const edited = record();
    edited.reagents[0] = {
      ...edited.reagents[0],
      inputValue: 70,
      inputUnit: null,
      massUnit: "mg",
      molecularWeight: 411.457,
    };
    const plan = calculateExperiment(edited);
    expect(plan.referenceAmountUmol).toBeCloseTo(170.127134, 6);
    expect(plan.rows.find(row => row.id === "liquid")?.amountUmol).toBeCloseTo(340.254267, 6);
  });
});
