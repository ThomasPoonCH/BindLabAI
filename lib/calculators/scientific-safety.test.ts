import { describe, expect, it } from "vitest";
import { calculateVolumeFromMassAndDensity } from "./chemistry";
import { convertUnits, dilutionPlan, formatDisplay, molarityFromAmount, molesFromMass } from "./engine";
import { calculatePerReference, calculatePercentVv } from "./parts";
import { calculateRequiredMassFromEquiv, calculateSolventVolumeForTargetConcentration } from "./synthesis";

describe("scientific calculation safety matrix", () => {
  it("normalizes L, mL, and uL before arithmetic", () => {
    expect(convertUnits(2, "L", "mL").value).toBe(2000);
    expect(convertUnits(1, "mL", "uL").value).toBe(1000);
    const tfa = calculatePerReference({ referenceA: 5, unitA: "mL", referenceB: 10000, unitB: "mL", actualB: 2, actualBUnit: "L" });
    expect(tfa.amountA).toBe(1);
    expect(tfa.actualInReferenceB).toBe(2000);
  });

  it("normalizes grams, milligrams, mol, and mmol", () => {
    expect(convertUnits(1, "g", "mg").value).toBe(1000);
    expect(convertUnits(1, "mol", "mmol").value).toBe(1000);
    expect(molesFromMass(180.156, "mg", 180.156).mol).toBeCloseTo(0.001);
  });

  it("calculates molarity and dilution in base units", () => {
    expect(molarityFromAmount(1, "mmol", 10, "mL").valueM).toBeCloseTo(0.1);
    const plan = dilutionPlan(1, "M", 10, "mM", 100, "mL");
    expect(plan.stockVolume).toBeCloseTo(1);
    expect(plan.diluentVolume).toBeCloseTo(99);
  });

  it("calculates equivalents, density volume, and target solvent volume", () => {
    expect(calculateRequiredMassFromEquiv(0.001, 1.2, 380.23)).toBeCloseTo(0.456276);
    expect(calculateVolumeFromMassAndDensity(1, 0.5)).toBe(2);
    expect(calculateSolventVolumeForTargetConcentration(0.001, 0.1)).toBeCloseTo(0.01);
  });

  it("keeps percent calculations tied to the displayed final-volume unit", () => {
    expect(calculatePercentVv(0.05, 2, "L")).toEqual(expect.objectContaining({ amountA: 0.001, amountB: 1.999, unit: "L" }));
    expect(calculatePercentVv(0.05, 2000, "mL").amountA).toBeCloseTo(1);
  });

  it("handles rounding and extreme finite values without changing calculations", () => {
    expect(formatDisplay(0.000000123456, "automatic")).toBe("1.235e-7");
    expect(convertUnits(1e12, "uL", "L").value).toBe(1e6);
    expect(convertUnits(1e-9, "L", "nL").value).toBe(1);
  });

  it("rejects negative, non-finite, incompatible, and locale-ambiguous values", () => {
    expect(() => convertUnits(-1, "mL", "L")).toThrow();
    expect(() => convertUnits(Number.NaN, "mL", "L")).toThrow();
    expect(() => convertUnits(Number.POSITIVE_INFINITY, "mL", "L")).toThrow();
    expect(() => convertUnits(1, "g", "mL")).toThrow("incompatible");
    expect(() => convertUnits(Number("1,5"), "mL", "L")).toThrow();
  });

  it("rejects missing or zero divisors instead of displaying invalid results", () => {
    expect(() => molarityFromAmount(1, "mmol", 0, "mL")).toThrow();
    expect(() => dilutionPlan(0, "M", 1, "mM", 10, "mL")).toThrow();
    expect(() => calculateVolumeFromMassAndDensity(1, 0)).toThrow();
  });
});
