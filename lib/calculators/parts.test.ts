import { describe, expect, it } from "vitest";
import { calculateAddTo, calculateComponentRatio, calculateInTotal, calculatePerReference, calculatePercentVv, normalizeUnit } from "./parts";

describe("X Parts in Y Parts calculator", () => {
  it("calculates 5 mL per 10,000 mL for 2 L", () => { const r = calculatePerReference({ referenceA: 5, unitA: "mL", referenceB: 10000, unitB: "mL", actualB: 2, actualBUnit: "L" }); expect(r.amountA).toBe(1); expect(r.practical).toEqual({ value: 1, unit: "mL" }); });
  it("calculates component ratios", () => { expect(calculateComponentRatio(4, 6, 10, "mL").amountA).toBe(4); expect(calculateComponentRatio(1, 1, 500, "uL").amountB).toBe(250); });
  it("calculates total-parts, addition, and percent v/v", () => { expect(calculateInTotal(1, 1000, 2000, "mL").amountA).toBe(2); expect(calculateAddTo(1, 100, 25, "mL").amountA).toBeCloseTo(0.25); expect(calculatePercentVv(0.05, 2000, "mL").amountA).toBeCloseTo(1); });
  it("normalizes aliases and rejects invalid parts", () => { expect(normalizeUnit("ul")).toBe("uL"); expect(normalizeUnit("µL")).toBe("uL"); expect(() => calculateComponentRatio(1, 0, 10, "mL")).toThrow(); expect(() => calculatePerReference({ referenceA: 1, unitA: "mL", referenceB: 1, unitB: "mL", actualB: 1, actualBUnit: "g" })).toThrow("incompatible"); });
});
