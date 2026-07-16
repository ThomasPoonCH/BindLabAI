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
});
