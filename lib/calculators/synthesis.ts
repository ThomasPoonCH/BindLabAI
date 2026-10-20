import { assertPositive, assertNonNegative, finiteResult } from "./validation";

export type ReagentInput = {
  name: string;
  moles: number;
  stoichiometry?: number;
};

export function calculateEquivalents(actualMoles: number, limitingMoles: number) {
  assertNonNegative(actualMoles, "actualMoles");
  assertPositive(limitingMoles, "limitingMoles");
  return finiteResult(actualMoles / limitingMoles);
}

export function calculateRequiredMolesFromEquiv(limitingMoles: number, equiv: number) {
  assertPositive(limitingMoles, "limitingMoles");
  assertPositive(equiv, "equiv");
  return finiteResult(limitingMoles * equiv);
}

export function calculateRequiredMassFromEquiv(limitingMoles: number, equiv: number, molecularWeight: number) {
  assertPositive(molecularWeight, "molecularWeight");
  return finiteResult(calculateRequiredMolesFromEquiv(limitingMoles, equiv) * molecularWeight);
}

export function calculateRequiredVolumeFromEquiv(limitingMoles: number, equiv: number, molecularWeight: number, density: number) {
  assertPositive(density, "density");
  return finiteResult(calculateRequiredMassFromEquiv(limitingMoles, equiv, molecularWeight) / density);
}

export function calculateReactionConcentration(limitingMoles: number, solventVolumeL: number) {
  assertNonNegative(limitingMoles, "limitingMoles");
  assertPositive(solventVolumeL, "solventVolumeL");
  return finiteResult(limitingMoles / solventVolumeL);
}

export function calculateSolventVolumeForTargetConcentration(limitingMoles: number, targetConcentrationM: number) {
  assertNonNegative(limitingMoles, "limitingMoles");
  assertPositive(targetConcentrationM, "targetConcentrationM");
  return finiteResult(limitingMoles / targetConcentrationM);
}

export function calculateTheoreticalYield(limitingMoles: number, productMW: number) {
  assertNonNegative(limitingMoles, "limitingMoles");
  assertPositive(productMW, "productMW");
  return finiteResult(limitingMoles * productMW);
}

export function calculatePercentYield(actualMass: number, theoreticalMass: number) {
  assertNonNegative(actualMass, "actualMass");
  assertPositive(theoreticalMass, "theoreticalMass");
  return finiteResult((actualMass / theoreticalMass) * 100);
}

export function identifyLimitingReagent(reagents: ReagentInput[]) {
  if (reagents.length === 0) throw new Error("At least one reagent is required");
  for (const reagent of reagents) { assertPositive(reagent.moles, "Reagent moles"); if (reagent.stoichiometry === undefined) throw new Error("Specify each reagent stoichiometric coefficient; 1:1 is not assumed."); assertPositive(reagent.stoichiometry, "Stoichiometric coefficient"); }
  return reagents.reduce((current, reagent) => {
    const normalized = reagent.moles / (reagent.stoichiometry ?? 1);
    const currentNormalized = current.moles / (current.stoichiometry ?? 1);
    return normalized < currentNormalized ? reagent : current;
  });
}
