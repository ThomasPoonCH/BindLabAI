import { assertPositive, assertNonNegative } from "./validation";
import { convertUnits } from "./engine";

function finiteResult(value: number) { if (!Number.isFinite(value)) throw new Error("Calculation is outside the supported numerical range."); return value; }

export type VolumeUnit = "uL" | "mL" | "L";
export type ConcentrationUnit = "M" | "mM" | "uM" | "nM";
export type RatioDilutionInterpretation = "one_in_total" | "one_part_plus_x";

export type MixtureReagentInput = {
  name: string;
  stockConcentration: number;
  targetConcentration: number;
  concentrationUnit: ConcentrationUnit;
};

export function calculateMolarity(moles: number, volumeL: number) {
  assertNonNegative(moles, "moles");
  assertPositive(volumeL, "volumeL");
  return finiteResult(moles / volumeL);
}

export function calculateMolesFromMolarity(concentrationM: number, volumeL: number) {
  assertPositive(concentrationM, "concentrationM");
  assertPositive(volumeL, "volumeL");
  return finiteResult(concentrationM * volumeL);
}

export function calculateVolumeFromMolesAndConcentration(moles: number, concentrationM: number) {
  assertNonNegative(moles, "moles");
  assertPositive(concentrationM, "concentrationM");
  return finiteResult(moles / concentrationM);
}

export function calculateMassFromMoles(moles: number, molecularWeight: number) {
  assertNonNegative(moles, "moles");
  assertPositive(molecularWeight, "molecularWeight");
  return finiteResult(moles * molecularWeight);
}

export function calculateMolesFromMass(massG: number, molecularWeight: number) {
  assertNonNegative(massG, "massG");
  assertPositive(molecularWeight, "molecularWeight");
  return finiteResult(massG / molecularWeight);
}

export function calculateMolecularWeightFromMassAndMoles(massG: number, moles: number) {
  assertNonNegative(massG, "massG");
  assertPositive(moles, "moles");
  return finiteResult(massG / moles);
}

export function calculateDilutionVolume(C1: number, C2: number, V2: number) {
  assertPositive(C1, "C1");
  assertPositive(C2, "C2");
  assertPositive(V2, "V2");
  if (C2 > C1) throw new Error("C2 cannot be greater than C1 for a simple dilution");
  return finiteResult((C2 * V2) / C1);
}

export function calculateFinalDilutionConcentration(C1: number, V1: number, V2: number) {
  assertPositive(C1, "C1");
  assertPositive(V1, "V1");
  assertPositive(V2, "V2");
  if (V1 > V2) throw new Error("V1 cannot be greater than V2");
  return finiteResult((C1 * V1) / V2);
}

export function calculateVolumeFromMassAndDensity(massG: number, densityGPerMl: number) {
  assertNonNegative(massG, "massG");
  assertPositive(densityGPerMl, "densityGPerMl");
  return finiteResult(massG / densityGPerMl);
}

export function calculateMassFromVolumeAndDensity(volumeMl: number, densityGPerMl: number) {
  assertPositive(volumeMl, "volumeMl");
  assertPositive(densityGPerMl, "densityGPerMl");
  return finiteResult(volumeMl * densityGPerMl);
}

export function convertVolumeToL(value: number, unit: VolumeUnit) {
  return convertUnits(value, unit, "L").value;
}

export function convertVolumeFromL(valueL: number, unit: VolumeUnit) {
  return convertUnits(valueL, "L", unit).value;
}

export function convertConcentrationToM(value: number, unit: ConcentrationUnit) {
  return convertUnits(value, unit, "M").value;
}

export function calculateFoldDilutionRecipe(foldFactor: number, finalVolume: number, unit: VolumeUnit) {
  assertPositive(foldFactor, "foldFactor");
  if (foldFactor <= 1) throw new Error("Fold factor must be greater than 1");
  const finalVolumeL = convertVolumeToL(finalVolume, unit);
  const stockVolumeL = finalVolumeL / foldFactor;
  const diluentVolumeL = finalVolumeL - stockVolumeL;

  return {
    stockVolume: convertVolumeFromL(stockVolumeL, unit),
    diluentVolume: convertVolumeFromL(diluentVolumeL, unit),
    finalVolume,
    unit
  };
}

export function calculateRatioDilutionRecipe(ratioX: number, finalVolume: number, unit: VolumeUnit, interpretation: RatioDilutionInterpretation) {
  assertPositive(ratioX, "ratioX");
  if (ratioX <= 1) throw new Error("Ratio X must be greater than 1");
  const finalVolumeL = convertVolumeToL(finalVolume, unit);
  const stockVolumeL = interpretation === "one_in_total"
    ? finalVolumeL / ratioX
    : finalVolumeL / (ratioX + 1);
  const diluentVolumeL = finalVolumeL - stockVolumeL;

  return {
    stockVolume: convertVolumeFromL(stockVolumeL, unit),
    diluentVolume: convertVolumeFromL(diluentVolumeL, unit),
    finalVolume,
    unit,
    warning: interpretation === "one_in_total"
      ? "Interpretation: 1 in X total means stock is final volume divided by X. Ratio notation can be ambiguous; confirm with your SOP."
      : "Interpretation: 1 part stock + X parts diluent means total parts are X + 1. Ratio notation can be ambiguous; confirm with your SOP."
  };
}

export function calculateMultiSubstanceMixtureRecipe(finalVolume: number, unit: VolumeUnit, reagents: MixtureReagentInput[]) {
  const finalVolumeL = convertVolumeToL(finalVolume, unit);
  if (reagents.length === 0) throw new Error("At least one substance is required");

  const rows = reagents.map((reagent) => {
    const stockM = convertConcentrationToM(reagent.stockConcentration, reagent.concentrationUnit);
    const targetM = convertConcentrationToM(reagent.targetConcentration, reagent.concentrationUnit);
    if (stockM <= targetM) throw new Error(`${reagent.name}: stock concentration must be higher than target concentration`);
    const volumeToAddL = (targetM * finalVolumeL) / stockM;
    return {
      ...reagent,
      volumeToAdd: convertVolumeFromL(volumeToAddL, unit),
      volumeToAddL
    };
  });

  const totalReagentVolumeL = rows.reduce((sum, row) => sum + row.volumeToAddL, 0);
  if (totalReagentVolumeL > finalVolumeL) {
    throw new Error("Impossible mixture: reagent volumes exceed final volume.");
  }

  const diluentVolumeL = finalVolumeL - totalReagentVolumeL;
  return {
    rows,
    totalReagentVolume: convertVolumeFromL(totalReagentVolumeL, unit),
    diluentVolume: convertVolumeFromL(diluentVolumeL, unit),
    finalVolume,
    unit,
    warning: rows.some((row) => row.volumeToAddL < 1 / 1_000_000)
      ? "Volume is very small; prepare an intermediate dilution for better pipetting accuracy."
      : null
  };
}
