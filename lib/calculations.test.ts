import { describe, expect, it } from "vitest";
import {
  calculateMassFromMoles,
  calculateMolarity,
  calculateVolumeFromMassAndDensity,
  calculateVolumeFromMolesAndConcentration,
  convertMlToUl,
  convertUlToMl,
  selectPipetteRange
} from "./calculations";

describe("calculation helpers", () => {
  it("calculates molarity from moles and liters", () => {
    expect(calculateMolarity(0.1, 0.5)).toBeCloseTo(0.2);
  });

  it("calculates volume from moles and concentration", () => {
    const volumeL = calculateVolumeFromMolesAndConcentration(85e-6, 0.1333);
    expect(volumeL).toBeCloseTo(0.0006377, 7);
    expect(volumeL * 1000).toBeCloseTo(0.6377, 4);
  });

  it("calculates mass from moles and molecular weight", () => {
    expect(calculateMassFromMoles(0.002, 180.16)).toBeCloseTo(0.36032);
  });

  it("calculates volume from mass and density", () => {
    expect(calculateVolumeFromMassAndDensity(1.5, 0.75)).toBeCloseTo(2);
  });

  it("converts microliters and milliliters", () => {
    expect(convertUlToMl(637.7)).toBeCloseTo(0.6377);
    expect(convertMlToUl(0.6377)).toBeCloseTo(637.7);
  });

  it("selects practical pipette ranges", () => {
    expect(selectPipetteRange(0.1)).toContain("too small");
    expect(selectPipetteRange(1.5)).toBe("P10");
    expect(selectPipetteRange(15)).toBe("P20");
    expect(selectPipetteRange(150)).toBe("P200");
    expect(selectPipetteRange(637.7)).toBe("P1000");
    expect(selectPipetteRange(1200)).toContain("serological");
  });

  it("rejects impossible divisors", () => {
    expect(() => calculateMolarity(1, 0)).toThrow();
    expect(() => calculateVolumeFromMolesAndConcentration(1, Number.NaN)).toThrow();
  });
});
