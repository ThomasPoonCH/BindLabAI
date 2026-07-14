import { describe, expect, it } from "vitest";
import { convertUnits, dilutionPlan, molarityFromAmount, molesFromMass } from "./engine";

describe("shared validated calculation engine", () => {
  it("converts volume exactly", () => { expect(convertUnits(16, "mL", "uL").value).toBe(16000); expect(convertUnits(1.5, "L", "mL").value).toBe(1500); expect(convertUnits(250, "uL", "mL").value).toBeCloseTo(0.25); expect(convertUnits(1, "uL", "nL").value).toBe(1000); expect(convertUnits(0.001, "mL", "uL").value).toBe(1); });
  it("converts mass, amount, and concentration", () => { expect(convertUnits(1, "g", "mg").value).toBe(1000); expect(convertUnits(65, "mg", "g").value).toBeCloseTo(0.065); expect(convertUnits(2.5, "mg", "ug").value).toBe(2500); expect(convertUnits(0.2, "mmol", "umol").value).toBe(200); expect(convertUnits(157.975, "umol", "mmol").value).toBeCloseTo(0.157975); expect(convertUnits(0.133333, "M", "mM").value).toBeCloseTo(133.333); expect(convertUnits(5, "mM", "uM").value).toBe(5000); expect(convertUnits(1, "mg/mL", "g/L").value).toBe(1); });
  it("calculates molarity and moles from mass", () => { expect(molarityFromAmount(0.2, "mmol", 1.5, "mL").valueM).toBeCloseTo(0.1333333333); expect(molarityFromAmount(100, "umol", 1, "mL").valueM).toBeCloseTo(0.1); expect(molesFromMass(65, "mg", 411.457).mol * 1e6).toBeCloseTo(157.975, 3); });
  it("calculates dilution and validates invalid inputs", () => { const plan = dilutionPlan(1, "M", 100, "mM", 10, "mL"); expect(plan.stockVolume).toBeCloseTo(1); expect(plan.diluentVolume).toBeCloseTo(9); expect(() => dilutionPlan(1, "M", 2, "M", 1, "mL")).toThrow("Target concentration cannot"); expect(() => convertUnits(1, "mg/mL", "mM")).toThrow("molecular weight"); });
});
