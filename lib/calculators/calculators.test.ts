import { describe, expect, it } from "vitest";
import {
  calculateDilutionVolume,
  calculateFinalDilutionConcentration,
  calculateFoldDilutionRecipe,
  calculateMolesFromMass,
  calculateMolesFromMolarity,
  calculateMolecularWeightFromMassAndMoles,
  calculateMultiSubstanceMixtureRecipe,
  calculateRatioDilutionRecipe,
  calculateVolumeFromMolesAndConcentration
} from "./chemistry";
import {
  calculateEquivalents,
  calculatePercentYield,
  calculateSolventVolumeForTargetConcentration,
  identifyLimitingReagent
} from "./synthesis";
import {
  calculateAcnWaterVolumes,
  calculateAdditiveVolume,
  calculateFinalSampleConcentration,
  calculateLcmsDilution,
  calculateMobilePhaseConsumption,
  calculatePeakResolution,
  calculateRetentionTimeDifference,
  generateGradientTable
} from "./lcms";
import { convertMolToUmol, convertMmolToMol, selectPipetteRange } from "./units";

describe("expanded calculator suite", () => {
  it("calculates solvent volume for 85 umol at 0.1333 M", () => {
    const volumeL = calculateSolventVolumeForTargetConcentration(0.000085, 0.1333);
    expect(volumeL).toBeCloseTo(0.0006377, 7);
    expect(volumeL * 1000).toBeCloseTo(0.6377, 4);
    expect(volumeL * 1_000_000).toBeCloseTo(637.7, 1);
  });

  it("handles core chemistry conversions", () => {
    expect(calculateMolesFromMolarity(0.5, 0.25)).toBeCloseTo(0.125);
    expect(calculateMolesFromMass(0.18, 180)).toBeCloseTo(0.001);
    expect(calculateMolecularWeightFromMassAndMoles(0.18, 0.001)).toBeCloseTo(180);
    expect(convertMmolToMol(2)).toBeCloseTo(0.002);
    expect(convertMolToUmol(0.000085)).toBeCloseTo(85);
  });

  it("calculates dilutions", () => {
    expect(calculateDilutionVolume(10, 1, 100)).toBeCloseTo(10);
    expect(calculateFinalDilutionConcentration(10, 10, 100)).toBeCloseTo(1);
  });

  it("calculates fold dilution recipes", () => {
    const recipe = calculateFoldDilutionRecipe(10, 100, "uL");
    expect(recipe.stockVolume).toBeCloseTo(10);
    expect(recipe.diluentVolume).toBeCloseTo(90);
  });

  it("calculates both ratio dilution interpretations", () => {
    const oneInTotal = calculateRatioDilutionRecipe(100, 1000, "uL", "one_in_total");
    expect(oneInTotal.stockVolume).toBeCloseTo(10);
    expect(oneInTotal.diluentVolume).toBeCloseTo(990);
    expect(oneInTotal.warning).toContain("1 in X total");

    const parts = calculateRatioDilutionRecipe(100, 1010, "uL", "one_part_plus_x");
    expect(parts.stockVolume).toBeCloseTo(10);
    expect(parts.diluentVolume).toBeCloseTo(1000);
    expect(parts.warning).toContain("1 part stock");
  });

  it("calculates multi-substance mixture recipes with concentration unit conversion", () => {
    const recipe = calculateMultiSubstanceMixtureRecipe(1000, "uL", [
      { name: "Substance A", stockConcentration: 10, targetConcentration: 1, concentrationUnit: "mM" },
      { name: "Substance B", stockConcentration: 100, targetConcentration: 10, concentrationUnit: "uM" }
    ]);

    expect(recipe.rows[0].volumeToAdd).toBeCloseTo(100);
    expect(recipe.rows[1].volumeToAdd).toBeCloseTo(100);
    expect(recipe.diluentVolume).toBeCloseTo(800);
  });

  it("blocks impossible mixture recipes", () => {
    expect(() => calculateMultiSubstanceMixtureRecipe(100, "uL", [
      { name: "A", stockConcentration: 2, targetConcentration: 1.5, concentrationUnit: "mM" },
      { name: "B", stockConcentration: 2, targetConcentration: 1.5, concentrationUnit: "mM" }
    ])).toThrow("Impossible mixture");
  });

  it("calculates synthesis values", () => {
    expect(calculateEquivalents(0.002, 0.001)).toBeCloseTo(2);
    expect(calculatePercentYield(0.08, 0.1)).toBeCloseTo(80);
    expect(identifyLimitingReagent([
      { name: "A", moles: 0.001 },
      { name: "B", moles: 0.003, stoichiometry: 2 }
    ]).name).toBe("A");
  });

  it("calculates LCMS and HPLC values", () => {
    expect(calculateAcnWaterVolumes(1000, 70)).toEqual({ acnMl: 700, waterMl: 300 });
    expect(calculateAdditiveVolume(1000, 0.1)).toBeCloseTo(1);
    expect(calculateMobilePhaseConsumption(0.4, 15, 20, 20).totalWithExtraMl).toBeCloseTo(144);
    expect(calculateLcmsDilution(10, 990).dilutionFactor).toBeCloseTo(100);
    expect(calculateFinalSampleConcentration(1, 10, 1000)).toBeCloseTo(0.01);
    expect(calculatePeakResolution(2, 2.5, 0.1, 0.1)).toBeCloseTo(5);
    expect(calculateRetentionTimeDifference(2, 2.5)).toBeCloseTo(0.5);
    expect(generateGradientTable(5, 95, 10, 2, 3)).toHaveLength(5);
  });

  it("selects requested pipette ranges", () => {
    expect(selectPipetteRange(0.1)).toContain("too small");
    expect(selectPipetteRange(5)).toBe("P10");
    expect(selectPipetteRange(15)).toBe("P20");
    expect(selectPipetteRange(150)).toBe("P200");
    expect(selectPipetteRange(800)).toBe("P1000");
    expect(selectPipetteRange(1500)).toContain("serological");
  });

  it("blocks impossible concentrations", () => {
    expect(() => calculateVolumeFromMolesAndConcentration(1, 0)).toThrow();
  });
});
