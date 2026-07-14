import { assertPositive } from "./validation";

export type ReagentInput = {
  name: string;
  moles: number;
  stoichiometry?: number;
};

export function calculateEquivalents(actualMoles: number, limitingMoles: number) {
  assertPositive(limitingMoles, "limitingMoles");
  return actualMoles / limitingMoles;
}

export function calculateRequiredMolesFromEquiv(limitingMoles: number, equiv: number) {
  assertPositive(limitingMoles, "limitingMoles");
  assertPositive(equiv, "equiv");
  return limitingMoles * equiv;
}

export function calculateRequiredMassFromEquiv(limitingMoles: number, equiv: number, molecularWeight: number) {
  assertPositive(molecularWeight, "molecularWeight");
  return calculateRequiredMolesFromEquiv(limitingMoles, equiv) * molecularWeight;
}

export function calculateRequiredVolumeFromEquiv(limitingMoles: number, equiv: number, molecularWeight: number, density: number) {
  assertPositive(density, "density");
  return calculateRequiredMassFromEquiv(limitingMoles, equiv, molecularWeight) / density;
}

export function calculateReactionConcentration(limitingMoles: number, solventVolumeL: number) {
  assertPositive(solventVolumeL, "solventVolumeL");
  return limitingMoles / solventVolumeL;
}

export function calculateSolventVolumeForTargetConcentration(limitingMoles: number, targetConcentrationM: number) {
  assertPositive(targetConcentrationM, "targetConcentrationM");
  return limitingMoles / targetConcentrationM;
}

export function calculateTheoreticalYield(limitingMoles: number, productMW: number) {
  assertPositive(productMW, "productMW");
  return limitingMoles * productMW;
}

export function calculatePercentYield(actualMass: number, theoreticalMass: number) {
  assertPositive(theoreticalMass, "theoreticalMass");
  return (actualMass / theoreticalMass) * 100;
}

export function identifyLimitingReagent(reagents: ReagentInput[]) {
  if (reagents.length === 0) throw new Error("At least one reagent is required");
  return reagents.reduce((current, reagent) => {
    const normalized = reagent.moles / (reagent.stoichiometry ?? 1);
    const currentNormalized = current.moles / (current.stoichiometry ?? 1);
    return normalized < currentNormalized ? reagent : current;
  });
}
