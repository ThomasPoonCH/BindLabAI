import type { ExperimentRecord } from "@/lib/ai/experiment-schema";
import { calculateReactionPlan, type CalculatorRow, type InputUnit } from "./reaction-calculator";

export function recordToCalculatorRows(record: ExperimentRecord): CalculatorRow[] {
  return record.reagents.map((reagent) => {
    let inputValue = reagent.inputValue ?? null;
    let inputUnit = reagent.inputUnit ?? null;
    if (inputValue === null && reagent.isLimitingReagent) {
      if (reagent.mass !== null && reagent.massUnit) { inputValue = reagent.mass; inputUnit = reagent.massUnit; }
      else if (reagent.amountMmol !== null) { inputValue = reagent.amountMmol; inputUnit = "mmol"; }
      else if (reagent.volume !== null && reagent.volumeUnit) { inputValue = reagent.volume; inputUnit = reagent.volumeUnit; }
    }
    return {
      id: reagent.id,
      name: reagent.name ?? "Unnamed reagent",
      role: reagent.role ?? "reagent",
      form: reagent.physicalState ?? "unknown",
      molecularWeight: reagent.molecularWeight,
      density: reagent.density,
      densityUnit: reagent.densityUnit,
      stockConcentration: reagent.stockConcentration,
      stockConcentrationUnit: reagent.stockConcentrationUnit,
      equivalents: reagent.isLimitingReagent ? 1 : reagent.equivalents,
      inputValue,
      inputUnit: inputUnit as InputUnit | null,
      purityPercent: reagent.purityPercent ?? null,
      isReference: reagent.isLimitingReagent,
    };
  });
}

export function calculateExperiment(record: ExperimentRecord) {
  return calculateReactionPlan(recordToCalculatorRows(record), record.conditions.targetConcentration, record.conditions.targetConcentrationUnit);
}

export function theoreticalProduct(record: ExperimentRecord) {
  const plan = calculateExperiment(record);
  if (!record.productStoichiometry || plan.referenceAmountUmol === null) return null;
  const amountUmol = plan.referenceAmountUmol * record.productStoichiometry;
  const massMg = record.expectedMolecularWeight ? amountUmol * record.expectedMolecularWeight / 1000 : null;
  return { amountUmol, massMg };
}
