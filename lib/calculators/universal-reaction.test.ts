import { describe, expect, it } from "vitest";
import { calculateUniversalPlan, type UniversalExperiment } from "./universal-reaction";

const base: UniversalExperiment = { name: "Test", category: "", targetProductName: "", limitingName: "A", limitingInputMode: "mass", limitingMw: 100, limitingMassMg: 10, desiredConcentration: 0.1, temperature: "", time: "", atmosphere: "", notes: "", reagents: [], solvents: [], makeTotalVolume: false, analysis: "none", analysisCustom: "" };

describe("universal reaction planning", () => {
  it("plans an amide coupling", () => {
    const plan = calculateUniversalPlan({ ...base, reagents: [{ id: "hatu", name: "HATU", role: "reagent", form: "solid", molecularWeight: 380.23, equivalents: 1.1, calculationMode: "equivalents", notes: "" }] });
    expect(plan.limitingMmol).toBeCloseTo(0.1);
    expect(plan.reagents[0].amount).toContain("mg");
  });
  it("plans a Suzuki-type liquid base", () => {
    const plan = calculateUniversalPlan({ ...base, reagents: [{ id: "base", name: "Liquid base", role: "base", form: "liquid", molecularWeight: 129.25, density: 0.742, equivalents: 2, calculationMode: "equivalents", notes: "" }] });
    expect(plan.reagents[0].amount).toMatch(/(uL|mL)/);
  });
  it("plans a click/conjugation stock solution", () => {
    const plan = calculateUniversalPlan({ ...base, reagents: [{ id: "azide", name: "Azide stock", role: "reactant", form: "stock solution", stockConcentration: 0.01, equivalents: 1.2, calculationMode: "equivalents", notes: "" }] });
    expect(plan.reagents[0].amount).toMatch(/(uL|mL)/);
  });
  it("supports a simple dilution/sample preparation without LCMS or concentration", () => {
    const plan = calculateUniversalPlan({ ...base, name: "Dilution", limitingInputMode: "mmol", limitingMmol: 0.01, desiredConcentration: undefined, analysis: "none", reagents: [{ id: "sample", name: "Sample", role: "other", form: "stock solution", calculationMode: "manual", manualAmount: "10 uL", notes: "" }] });
    expect(plan.totalVolumeMl).toBeNull();
    expect(plan.missing).toHaveLength(0);
  });
  it("supports a custom reaction with no concentration or analysis", () => {
    const plan = calculateUniversalPlan({ ...base, name: "Custom reaction", desiredConcentration: undefined, analysis: "none", reagents: [{ id: "gas", name: "Gas reagent", role: "reagent", form: "gas", equivalents: 1, calculationMode: "equivalents", notes: "" }] });
    expect(plan.reagents[0].amount).toContain("mmol");
    expect(plan.missing).toHaveLength(0);
  });
});
