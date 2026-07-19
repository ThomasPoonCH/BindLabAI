import { describe, expect, it } from "vitest";
import { actualConcentrationM, amountFromMass, amountToUmol, calculateReactionPlan, concentrationToM, massFromAmount, massToMg, neatLiquidVolume, purityCorrectedMass, reagentAmount, solventVolumeMl, stockVolumeUl, volumeToMl, type CalculatorRow } from "./reaction-calculator";

const row = (patch: Partial<CalculatorRow>): CalculatorRow => ({ id: "x", name: "Reagent", role: "reagent", form: "solid", molecularWeight: null, density: null, densityUnit: "g/mL", stockConcentration: null, stockConcentrationUnit: "M", equivalents: null, inputValue: null, inputUnit: null, purityPercent: null, isReference: false, ...patch });
const fixture = [
  row({ id: "substrate", name: "12-COOH stereoisomer substrate", role: "reactant", molecularWeight: 411.457, equivalents: 1, inputValue: 70, inputUnit: "mg", isReference: true }),
  row({ id: "hatu", name: "HATU", molecularWeight: 380.23, equivalents: 1.2 }),
  row({ id: "dipea", name: "DIPEA", form: "liquid", molecularWeight: 129.24, density: 0.742, equivalents: 4 }),
  row({ id: "methylamine-hcl", name: "Methylamine hydrochloride", molecularWeight: 67.52, equivalents: 1.5 }),
  row({ id: "dmf", name: "DMF", role: "solvent", form: "liquid" }),
  row({ id: "product", name: "Expected 12-NHMe stereoisomer product", role: "product", molecularWeight: 424.5 }),
];

describe("Excel-compatible deterministic reaction calculations", () => {
  it("calculates amount from substrate mass and full-precision MW", () => expect(amountFromMass(70, 411.457)).toBeCloseTo(170.127134, 6));
  it("calculates reagent amount from equivalents", () => expect(reagentAmount(170.125893, 1.2)).toBeCloseTo(204.151072, 6));
  it("calculates mass from amount and MW", () => expect(massFromAmount(204.151072, 380.23)).toBeCloseTo(77.624, 2));
  it("calculates neat-liquid volume", () => expect(neatLiquidVolume(87.934896, 0.742)).toBeCloseTo(118.51, 2));
  it("calculates stock-solution volume", () => expect(stockVolumeUl(255.18884, 0.5)).toBeCloseTo(510.37768, 5));
  it("calculates solvent volume and actual concentration", () => { const volume = solventVolumeMl(170.125893, 0.133333333333333); expect(volume).toBeCloseTo(1.275944, 6); expect(actualConcentrationM(170.125893, volume!)).toBeCloseTo(0.133333333333333, 10); });
  it("converts supported units", () => { expect(massToMg(1000, "ug")).toBe(1); expect(massToMg(1, "g")).toBe(1000); expect(amountToUmol(1, "mmol")).toBe(1000); expect(volumeToMl(1000, "uL")).toBe(1); expect(concentrationToM(100, "mM")).toBe(0.1); });
  it("supports purity correction", () => expect(purityCorrectedMass(77.61, 95)).toBeCloseTo(81.6947, 4));
  it("rejects zero and negative inputs", () => { expect(amountFromMass(0, 100)).toBeNull(); expect(reagentAmount(100, -1)).toBeNull(); expect(solventVolumeMl(100, 0)).toBeNull(); });
  it("reproduces the workbook fixture and excludes solvent/product additions", () => { const plan = calculateReactionPlan(fixture, 0.133333333333333, "M"); expect(plan.referenceAmountUmol).toBeCloseTo(170.127134, 6); expect(plan.rows.find(x => x.id === "hatu")?.theoreticalMassMg).toBeCloseTo(77.62, 2); expect(plan.rows.find(x => x.id === "dipea")?.liquidVolumeUl).toBeCloseTo(118.5, 1); expect(plan.rows.find(x => x.id === "methylamine-hcl")?.theoreticalMassMg).toBeCloseTo(17.23, 2); expect(plan.totalVolumeMl).toBeCloseTo(1.27595, 5); expect(plan.rows.some(x => x.id === "product")).toBe(false); expect(plan.rows.some(x => x.id === "dmf")).toBe(false); });
  it("reports missing trusted properties only where required", () => { const missingMw = calculateReactionPlan([row({ name: "Custom", isReference: true, inputValue: 10, inputUnit: "mg" })], null, "M"); expect(missingMw.errors.join(" ")).toContain("MW unavailable"); const missingDensity = calculateReactionPlan([row({ name: "Ref", molecularWeight: 100, isReference: true, inputValue: 1, inputUnit: "mmol" }), row({ name: "Liquid", form: "liquid", molecularWeight: 50, equivalents: 1 })], null, "M"); expect(missingDensity.errors.join(" ")).toContain("density"); });
  it("reacts deterministically to scale and equivalent changes", () => { const first = calculateReactionPlan(fixture, 0.133333333333333, "M"); const scaled = calculateReactionPlan(fixture.map(x => x.id === "substrate" ? { ...x, inputValue: 140 } : x), 0.133333333333333, "M"); expect(scaled.rows.find(x => x.id === "hatu")!.amountUmol).toBeCloseTo(first.rows.find(x => x.id === "hatu")!.amountUmol! * 2, 8); const changed = calculateReactionPlan(fixture.map(x => x.id === "hatu" ? { ...x, equivalents: 2 } : x), 0.133333333333333, "M"); expect(changed.rows.find(x => x.id === "dipea")!.amountUmol).toBeCloseTo(first.rows.find(x => x.id === "dipea")!.amountUmol!, 8); expect(changed.rows.find(x => x.id === "hatu")!.amountUmol).not.toBeCloseTo(first.rows.find(x => x.id === "hatu")!.amountUmol!, 8); });
  it("supports a neat-liquid reference from volume, density, and MW", () => {
    const plan = calculateReactionPlan([row({ name: "Liquid reference", form: "liquid", molecularWeight: 100, density: 1, inputValue: 100, inputUnit: "uL", equivalents: 1, isReference: true })], null, "M");
    expect(plan.referenceAmountUmol).toBeCloseTo(1000, 8);
  });
  it("supports a solution reference from volume and molarity", () => {
    const plan = calculateReactionPlan([row({ name: "Solution reference", form: "stock_solution", stockConcentration: 1, inputValue: 100, inputUnit: "uL", equivalents: 1, isReference: true })], null, "M");
    expect(plan.referenceAmountUmol).toBeCloseTo(100, 8);
  });
  it("calculates a non-reference stock solution from equivalents", () => {
    const plan = calculateReactionPlan([
      row({ id: "ref", name: "Reference", molecularWeight: 100, inputValue: 1, inputUnit: "mmol", equivalents: 1, isReference: true }),
      row({ id: "stock", name: "Stock reagent", form: "stock_solution", stockConcentration: 0.5, equivalents: 1.5 }),
    ], null, "M");
    const stock = plan.rows.find(item => item.id === "stock");
    expect(stock?.amountUmol).toBeCloseTo(1500, 8);
    expect(stock?.stockVolumeUl).toBeCloseTo(3000, 8);
  });
  it("supports fractional catalyst equivalents and molar planning", () => {
    const plan = calculateReactionPlan([
      row({ id: "ref", name: "Reference", inputValue: 100, inputUnit: "umol", equivalents: 1, isReference: true }),
      row({ id: "cat", name: "Catalyst", role: "catalyst", molecularWeight: 200, equivalents: 0.05 }),
    ], null, "M");
    expect(plan.rows.find(item => item.id === "cat")?.amountUmol).toBeCloseTo(5, 8);
    expect(plan.rows.find(item => item.id === "cat")?.theoreticalMassMg).toBeCloseTo(1, 8);
  });
  it("switches the calculation basis when the reference reagent changes", () => {
    const rows = [
      row({ id: "a", name: "A", molecularWeight: 100, inputValue: 10, inputUnit: "mg", equivalents: 1, isReference: true }),
      row({ id: "b", name: "B", molecularWeight: 200, inputValue: 40, inputUnit: "mg", equivalents: 2 }),
    ];
    const first = calculateReactionPlan(rows, null, "M");
    const switched = calculateReactionPlan(rows.map(item => ({ ...item, isReference: item.id === "b", equivalents: item.id === "b" ? 1 : item.equivalents })), null, "M");
    expect(first.referenceAmountUmol).toBeCloseTo(100, 8);
    expect(switched.referenceAmountUmol).toBeCloseTo(200, 8);
    expect(switched.rows.find(item => item.id === "a")?.amountUmol).toBeCloseTo(200, 8);
  });
  it("reports missing density and stock concentration only for forms that require them", () => {
    const plan = calculateReactionPlan([
      row({ id: "ref", name: "Reference", inputValue: 100, inputUnit: "umol", equivalents: 1, isReference: true }),
      row({ id: "liquid", name: "Liquid", form: "liquid", molecularWeight: 100, equivalents: 1 }),
      row({ id: "stock", name: "Stock", form: "stock_solution", equivalents: 1 }),
    ], null, "M");
    expect(plan.rows.find(item => item.id === "liquid")?.errors.join(" ")).toContain("density");
    expect(plan.rows.find(item => item.id === "stock")?.errors.join(" ")).toContain("stock concentration");
  });
  it("uses equivalents instead of a stale imported amount for the current plan", () => {
    const plan = calculateReactionPlan([
      row({ id: "ref", name: "Reference", inputValue: 100, inputUnit: "umol", equivalents: 1, isReference: true }),
      row({ id: "imported", name: "Imported reagent", molecularWeight: 100, equivalents: 0.5, inputValue: 999, inputUnit: "mg" }),
    ], null, "M");
    const imported = plan.rows.find(item => item.id === "imported");
    expect(imported?.amountUmol).toBeCloseTo(50, 8);
    expect(imported?.theoreticalMassMg).toBeCloseTo(5, 8);
  });
  it("never uses an imported quantity as the planned amount for a non-reference reagent", () => {
    const plan = calculateReactionPlan([
      row({ id: "ref", name: "Reference", molecularWeight: 100, inputValue: 100, inputUnit: "mg", equivalents: 1, isReference: true }),
      row({ id: "hatu", name: "HATU", molecularWeight: 380.23, equivalents: null, inputValue: 1, inputUnit: "g" }),
    ], null, "M");
    const hatu = plan.rows.find(item => item.id === "hatu");
    expect(hatu?.amountUmol).toBeNull();
    expect(hatu?.theoreticalMassMg).toBeNull();
    expect(hatu?.errors.join(" ")).toContain("enter equivalents");
  });
  it("calculates HATU from reference equivalents even when an imported 1 g value exists", () => {
    const plan = calculateReactionPlan([
      row({ id: "ref", name: "Reference", molecularWeight: 411.457, inputValue: 70, inputUnit: "mg", equivalents: 1, isReference: true }),
      row({ id: "hatu", name: "HATU", molecularWeight: 380.23, equivalents: 1.2, inputValue: 1, inputUnit: "g" }),
    ], null, "M");
    const hatu = plan.rows.find(item => item.id === "hatu");
    expect(hatu?.amountUmol).toBeCloseTo(204.15256, 5);
    expect(hatu?.theoreticalMassMg).toBeCloseTo(77.624928, 5);
    expect(hatu?.theoreticalMassMg).not.toBeCloseTo(1000, 1);
  });
  it("updates methylamine without changing the reference scale", () => {
    const initial = calculateReactionPlan(fixture, 0.133333333333333, "M");
    const changed = calculateReactionPlan(fixture.map(item => item.id === "methylamine-hcl" ? { ...item, equivalents: 0.5 } : item), 0.133333333333333, "M");
    expect(changed.referenceAmountUmol).toBeCloseTo(initial.referenceAmountUmol!, 10);
    expect(changed.rows.find(item => item.id === "methylamine-hcl")?.amountUmol).toBeCloseTo(85.063567, 5);
    expect(changed.rows.find(item => item.id === "methylamine-hcl")?.theoreticalMassMg).toBeCloseTo(5.743492, 6);
  });
  it("calculates solvent volume from a user-selected reagent concentration basis", () => {
    const target = 0.133333333333333;
    const plan = calculateReactionPlan(fixture, target, "M", "hatu");
    expect(plan.concentrationBasisReagentId).toBe("hatu");
    expect(plan.concentrationBasisName).toBe("HATU");
    expect(plan.totalVolumeMl).toBeCloseTo(1.531144, 5);
    expect(plan.rows.find(item => item.id === "hatu")?.actualConcentrationM).toBeCloseTo(target, 10);
    expect(plan.rows.find(item => item.id === "substrate")?.actualConcentrationM).toBeCloseTo(target / 1.2, 10);
  });
});
