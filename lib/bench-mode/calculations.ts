import type { BenchSession, Deviation, ExperimentPlan, ReagentKey, UpdatedPlan } from "./types";

export const round = (value: number, digits = 3) => Number(value.toFixed(digits));

export function calculatePlan(plan: ExperimentPlan, substrateMassMg: number): UpdatedPlan {
  const substrateMmol = substrateMassMg / plan.substrateMolecularWeight;
  const hatuMmol = substrateMmol * 1.2;
  const methylamineMmol = substrateMmol * 1.3;
  const dipeaMmol = substrateMmol * 4;
  const dipeaMassMg = dipeaMmol * 129.24;
  return {
    scaleFactor: substrateMassMg / plan.reagents.substrate.plannedValue,
    substrateMmol,
    substrateMassMg,
    hatuMmol,
    hatuMassMg: hatuMmol * 380.23,
    methylamineMmol,
    methylamineMassMg: methylamineMmol * 67.52,
    dipeaMmol,
    dipeaMassMg,
    dipeaVolumeUl: dipeaMassMg / 0.742,
    dmfVolumeUl: (substrateMmol / plan.targetConcentrationM) * 1000,
    theoreticalProductMmol: substrateMmol
  };
}

export function updatedValue(key: ReagentKey, calculated: UpdatedPlan) {
  const values: Record<ReagentKey, number> = {
    substrate: calculated.substrateMassMg,
    dmf: calculated.dmfVolumeUl,
    methylamine: calculated.methylamineMassMg,
    hatu: calculated.hatuMassMg,
    dipea: calculated.dipeaVolumeUl
  };
  return values[key];
}

export function actualEquivalents(key: ReagentKey, actual: number, state: UpdatedPlan) {
  if (key === "substrate") return 1;
  if (key === "hatu") return (actual / 380.23) / state.substrateMmol;
  if (key === "methylamine") return (actual / 67.52) / state.substrateMmol;
  if (key === "dipea") return ((actual * 0.742) / 129.24) / state.substrateMmol;
  return null;
}

export function currentConcentration(session: BenchSession) {
  const dmf = session.actuals.dmf?.value ?? session.updatedPlan.dmfVolumeUl;
  return dmf > 0 ? session.updatedPlan.substrateMmol / (dmf / 1000) : 0;
}

export function buildDeviations(plan: ExperimentPlan, session: BenchSession): Deviation[] {
  return (Object.entries(session.actuals) as [ReagentKey, NonNullable<BenchSession["actuals"][ReagentKey]>][])
    .filter(([, actual]) => actual.value >= 0)
    .map(([key, actual]) => {
      const planned = updatedValue(key, session.updatedPlan);
      const percentDifference = planned ? ((actual.value - planned) / planned) * 100 : 0;
      let consequence = "Recorded execution differs from the current plan.";
      if (key === "substrate") consequence = "Confirmed substrate amount changes the reaction scale and dependent quantities.";
      if (key === "dmf") consequence = `Estimated substrate concentration is ${round(currentConcentration(session), 3)} M rather than ${plan.targetConcentrationM.toFixed(3)} M.`;
      if (key === "hatu") consequence = `Actual HATU loading is ${round(actualEquivalents("hatu", actual.value, session.updatedPlan) ?? 0, 2)} eq rather than 1.20 eq.`;
      if (key === "methylamine") consequence = `Actual methylamine hydrochloride loading is ${round(actualEquivalents("methylamine", actual.value, session.updatedPlan) ?? 0, 2)} eq rather than 1.30 eq.`;
      if (key === "dipea") consequence = `Actual DIPEA loading is ${round(actualEquivalents("dipea", actual.value, session.updatedPlan) ?? 0, 2)} eq rather than 4.00 eq.`;
      return {
        id: key,
        reagent: key,
        planned,
        actual: actual.value,
        unit: actual.unit,
        percentDifference,
        consequence,
        needsReview: Math.abs(percentDifference) >= 5
      };
    })
    .filter((item) => Math.abs(item.percentDifference) >= 0.05);
}

export function calculateAmendment(state: UpdatedPlan) {
  const hatuMmol = state.substrateMmol * 0.5;
  const methylamineMmol = state.substrateMmol * 0.5;
  const dipeaMmol = state.substrateMmol * 0.5;
  const dipeaMassMg = dipeaMmol * 129.24;
  return {
    hatu: { currentEq: 1.2, addEq: 0.5, totalEq: 1.7, amount: hatuMmol * 380.23, unit: "mg" },
    methylamine: { currentEq: 1.3, addEq: 0.5, totalEq: 1.8, amount: methylamineMmol * 67.52, unit: "mg" },
    dipea: { currentEq: 4, addEq: 0.5, totalEq: 4.5, amount: dipeaMassMg / 0.742, unit: "uL" }
  };
}

export function calculateStockPlan(state: UpdatedPlan, concentrationM: number) {
  const stockVolumeUl = (state.dipeaMmol / concentrationM) * 1000;
  return {
    concentrationM,
    stockVolumeUl,
    additionalSolventUl: Math.max(0, stockVolumeUl - state.dipeaVolumeUl),
    projectedTotalVolumeUl: state.dmfVolumeUl + stockVolumeUl,
    projectedConcentrationM: state.substrateMmol / ((state.dmfVolumeUl + stockVolumeUl) / 1000)
  };
}
