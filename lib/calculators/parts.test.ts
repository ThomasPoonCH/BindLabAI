import { describe, expect, it } from "vitest";
import { calculateAddTo, calculateComponentRatio, calculateInTotal, calculatePerReference, calculatePercentVv, formatPartsInstruction, normalizeUnit } from "./parts";

describe("X Parts in Y Parts calculator", () => {
  it("calculates 5 mL per 10,000 mL for 2 L", () => { const r = calculatePerReference({ referenceA: 5, unitA: "mL", referenceB: 10000, unitB: "mL", actualB: 2, actualBUnit: "L" }); expect(r.amountA).toBe(1); expect(r.practical).toEqual({ value: 1, unit: "mL" }); });
  it("calculates component ratios", () => { expect(calculateComponentRatio(4, 6, 10, "mL").amountA).toBe(4); expect(calculateComponentRatio(1, 1, 500, "uL").amountB).toBe(250); });
  it("calculates total-parts, addition, and percent v/v", () => { expect(calculateInTotal(1, 1000, 2000, "mL").amountA).toBe(2); expect(calculateAddTo(1, 100, 25, "mL").amountA).toBeCloseTo(0.25); expect(calculatePercentVv(0.05, 2000, "mL").amountA).toBeCloseTo(1); });
  it("normalizes aliases and rejects invalid parts", () => { expect(normalizeUnit("ul")).toBe("uL"); expect(normalizeUnit("µL")).toBe("uL"); expect(() => calculateComponentRatio(1, 0, 10, "mL")).toThrow(); expect(() => calculatePerReference({ referenceA: 1, unitA: "mL", referenceB: 1, unitB: "mL", actualB: 1, actualBUnit: "g" })).toThrow("incompatible"); });

  it.each([
    [2, "L", "Add 1 mL TFA for 2 L water."],
    [2000, "mL", "Add 1 mL TFA for 2000 mL water."],
  ])("preserves an entered B amount of %s %s in the practical instruction", (actualB, actualBUnit, expected) => {
    const result = calculatePerReference({ referenceA: 5, unitA: "mL", referenceB: 10000, unitB: "mL", actualB, actualBUnit });
    expect(result.amountA).toBe(1);
    const instruction = formatPartsInstruction({ mode: "per_reference", substanceA: "TFA", substanceB: "water", amountA: result.amountA, amountB: null, resultUnit: result.unitA, finalVolume: 0, enteredB: actualB, enteredBUnit: actualBUnit });
    expect(instruction).toBe(expected);
    expect(instruction).not.toContain("1 mL TFA for 2 mL water");
  });

  it("preserves microlitre input without silently displaying millilitres", () => {
    const result = calculatePerReference({ referenceA: 1, unitA: "uL", referenceB: 1000, unitB: "uL", actualB: 500, actualBUnit: "µL" });
    const instruction = formatPartsInstruction({ mode: "per_reference", substanceA: "reagent A", substanceB: "reagent B", amountA: result.amountA, amountB: null, resultUnit: result.unitA, finalVolume: 0, enteredB: 500, enteredBUnit: "µL" });
    expect(result.amountA).toBe(0.5);
    expect(instruction).toBe("Add 0.5 µL reagent A for 500 µL reagent B.");
  });
});
