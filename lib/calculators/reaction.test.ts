import { describe, expect, it } from "vitest";
import { calculateLcmsMasses, calculateReactionPlan } from "./reaction";

describe("reaction workflow calculations", () => {
  it("calculates limiting reagent mmol and solvent volume from concentration", () => {
    const result = calculateReactionPlan({
      reactionName: "Demo",
      targetProductName: "Product",
      limitingReagent: "Acid",
      limitingMassMg: 65,
      limitingMolecularWeight: 411.457,
      targetConcentrationM: 0.1333,
      solvent: "DMF",
      reactionTemperature: "rt",
      reactionTime: "2 h",
      notes: "",
      productMolecularWeight: 549.62,
      mzTolerance: 0.5,
      crudeSampleVolumeUl: 1,
      lcmsFinalVolumeUl: 250,
      reagents: [
        { id: "hatu", name: "HATU", role: "coupling reagent", molecularWeight: 380.23, equivalents: 1.1, state: "solid" },
        { id: "dipea", name: "DIPEA", role: "base", molecularWeight: 129.25, equivalents: 3, density: 0.742, state: "liquid" }
      ]
    });

    expect(result.limitingMmol).toBeCloseTo(0.15797, 4);
    expect(result.totalReactionVolumeMl).toBeCloseTo(1.1851, 3);
    expect(result.reagents[0].massMg).toBeCloseTo(66.07, 1);
    expect(result.reagents[1].liquidVolumeUl).toBeCloseTo(82.52, 1);
    expect(result.warnings.some((warning) => warning.includes("DMF"))).toBe(true);
  });

  it("flags missing density and solution concentration", () => {
    const result = calculateReactionPlan({
      reactionName: "Missing data",
      targetProductName: "Product",
      limitingReagent: "A",
      limitingMassMg: 10,
      limitingMolecularWeight: 100,
      targetConcentrationM: 0.1,
      solvent: "",
      reactionTemperature: "",
      reactionTime: "",
      notes: "",
      productMolecularWeight: 150,
      mzTolerance: 0.5,
      crudeSampleVolumeUl: 1,
      lcmsFinalVolumeUl: 250,
      reagents: [
        { id: "liq", name: "Liquid reagent", role: "reactant", molecularWeight: 120, equivalents: 1, state: "liquid" },
        { id: "sol", name: "Solution reagent", role: "additive", molecularWeight: 80, equivalents: 1, state: "solution" }
      ]
    });

    expect(result.missingData).toContain("Missing solvent.");
    expect(result.missingData).toContain("Missing temperature.");
    expect(result.missingData).toContain("Missing reaction time.");
    expect(result.missingData).toContain("Liquid reagent: missing density for liquid volume.");
    expect(result.missingData).toContain("Solution reagent: missing stock concentration for solution.");
  });

  it("matches observed LCMS adducts within tolerance", () => {
    const masses = calculateLcmsMasses(549.62, 550.627, 0.5);
    expect(masses.find((mass) => mass.label === "[M+H]+")?.matches).toBe(true);
    expect(masses.find((mass) => mass.label === "[M+Na]+")?.matches).toBe(false);
  });
});
