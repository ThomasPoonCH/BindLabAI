export type LimitingInputMode = "mass" | "mmol" | "volume" | "stock";
export type UniversalRole = "reactant" | "reagent" | "catalyst" | "base" | "acid" | "ligand" | "additive" | "solvent" | "quench" | "other";
export type PhysicalForm = "solid" | "liquid" | "stock solution" | "gas" | "unknown";
export type CalculationMode = "equivalents" | "manual" | "informational";
export type AnalysisType = "none" | "LCMS" | "HPLC" | "NMR" | "custom";

export type UniversalReagent = {
  id: string;
  name: string;
  role: UniversalRole;
  form: PhysicalForm;
  molecularWeight?: number;
  equivalents?: number;
  mmol?: number;
  density?: number;
  stockConcentration?: number;
  calculationMode: CalculationMode;
  manualAmount?: string;
  notes: string;
};

export type SolventEntry = {
  id: string;
  name: string;
  mode: "volume" | "percent";
  value?: number;
  notes: string;
};

export type UniversalExperiment = {
  name: string;
  category: string;
  targetProductName: string;
  limitingName: string;
  limitingInputMode: LimitingInputMode;
  limitingMw?: number;
  limitingMassMg?: number;
  limitingMmol?: number;
  limitingVolumeMl?: number;
  limitingDensity?: number;
  limitingStockConcentration?: number;
  desiredConcentration?: number;
  temperature: string;
  time: string;
  atmosphere: string;
  notes: string;
  reagents: UniversalReagent[];
  solvents: SolventEntry[];
  makeTotalVolume: boolean;
  analysis: AnalysisType;
  analysisCustom: string;
  productMw?: number;
  lcmsSampleVolumeUl?: number;
  lcmsFinalVolumeUl?: number;
};

export type UniversalReagentResult = UniversalReagent & {
  calculatedMmol: number | null;
  amount: string;
  issues: string[];
};

export type UniversalPlan = {
  limitingMmol: number | null;
  totalVolumeMl: number | null;
  solventSummary: string;
  reagents: UniversalReagentResult[];
  missing: string[];
  review: string[];
  assumptions: string[];
};

const number = (value: number | undefined) => value !== undefined && Number.isFinite(value) && value > 0;
const fmt = (value: number, digits = 4) => Number(value.toPrecision(digits)).toString();

export function calculateUniversalPlan(input: UniversalExperiment): UniversalPlan {
  const missing: string[] = [];
  const review: string[] = [];
  const assumptions: string[] = ["All calculated values are planning estimates and require researcher/supervisor review."];
  const limitingMmol = calculateLimitingMmol(input, missing);

  let totalVolumeMl: number | null = null;
  if (input.desiredConcentration !== undefined) {
    if (!number(input.desiredConcentration)) missing.push("Desired concentration must be a positive value when provided.");
    else if (limitingMmol === null) missing.push("Limiting reagent amount is needed to calculate total reaction volume.");
    else {
      totalVolumeMl = limitingMmol / input.desiredConcentration;
      assumptions.push("Total reaction volume = limiting reagent mmol / desired concentration (M).");
    }
  }

  const reagents = input.reagents.map((reagent) => calculateReagent(reagent, limitingMmol, missing));
  const solventSummary = calculateSolventSummary(input, totalVolumeMl, missing, review, assumptions);

  if (input.analysis === "LCMS" && (!number(input.productMw) || !number(input.lcmsSampleVolumeUl) || !number(input.lcmsFinalVolumeUl))) {
    missing.push("LCMS plan needs product MW, crude sample volume, and final sample volume.");
  }

  if (input.analysis === "custom" && !input.analysisCustom.trim()) missing.push("Describe the custom analysis plan or choose another option.");
  if (input.desiredConcentration && input.desiredConcentration > 1) review.push("High concentration above 1 M: confirm solubility, mixing, and heat management.");
  if (input.desiredConcentration && input.desiredConcentration < 0.01) review.push("Low concentration below 0.01 M: confirm practicality and analytical sensitivity.");
  if (!input.name.trim()) review.push("Experiment name is blank. Add one before saving a reusable record.");

  return { limitingMmol, totalVolumeMl, solventSummary, reagents, missing: unique(missing), review: unique(review), assumptions };
}

function calculateLimitingMmol(input: UniversalExperiment, missing: string[]) {
  const mode = input.limitingInputMode;
  if (mode === "mmol") {
    if (!number(input.limitingMmol)) { missing.push("Enter a positive limiting-reagent amount in mmol."); return null; }
    return input.limitingMmol ?? null;
  }
  if (mode === "mass") {
    if (!number(input.limitingMassMg)) missing.push("Enter a positive limiting-reagent mass.");
    if (!number(input.limitingMw)) missing.push("Limiting reagent MW is needed for mass-to-mmol conversion.");
    return number(input.limitingMassMg) && number(input.limitingMw) ? (input.limitingMassMg as number) / (input.limitingMw as number) : null;
  }
  if (mode === "volume") {
    if (!number(input.limitingVolumeMl)) missing.push("Enter a positive limiting-reagent volume.");
    if (!number(input.limitingDensity)) missing.push("Limiting reagent density is needed for volume-to-mmol conversion.");
    if (!number(input.limitingMw)) missing.push("Limiting reagent MW is needed for volume-to-mmol conversion.");
    return number(input.limitingVolumeMl) && number(input.limitingDensity) && number(input.limitingMw)
      ? ((input.limitingVolumeMl as number) * (input.limitingDensity as number) / (input.limitingMw as number)) * 1000 : null;
  }
  if (!number(input.limitingVolumeMl)) missing.push("Enter a positive limiting stock volume.");
  if (!number(input.limitingStockConcentration)) missing.push("Limiting stock concentration is needed for stock-to-mmol conversion.");
  return number(input.limitingVolumeMl) && number(input.limitingStockConcentration)
    ? (input.limitingVolumeMl as number) * (input.limitingStockConcentration as number) : null;
}

function calculateReagent(reagent: UniversalReagent, limitingMmol: number | null, globalMissing: string[]): UniversalReagentResult {
  const issues: string[] = [];
  if (reagent.calculationMode === "informational") return { ...reagent, calculatedMmol: null, amount: "Informational only", issues };
  if (reagent.calculationMode === "manual") {
    if (!reagent.manualAmount?.trim()) issues.push(`${reagent.name || "Reagent"}: enter a manual amount or mark informational.`);
    globalMissing.push(...issues);
    return { ...reagent, calculatedMmol: reagent.mmol ?? null, amount: reagent.manualAmount?.trim() || "Manual amount missing", issues };
  }
  if (limitingMmol === null) issues.push(`${reagent.name || "Reagent"}: limiting reagent amount is needed for equivalents calculation.`);
  if (!number(reagent.equivalents)) issues.push(`${reagent.name || "Reagent"}: enter positive equivalents or choose another calculation mode.`);
  const calculatedMmol = limitingMmol !== null && number(reagent.equivalents) ? limitingMmol * (reagent.equivalents as number) : null;
  let amount = "Needs review";
  if (calculatedMmol !== null) {
    if (reagent.form === "gas" || reagent.form === "unknown") amount = `${fmt(calculatedMmol)} mmol`;
    else if (reagent.form === "solid") {
      if (!number(reagent.molecularWeight)) issues.push(`${reagent.name || "Reagent"}: MW is needed to calculate a solid mass.`);
      else amount = `${fmt(calculatedMmol * (reagent.molecularWeight as number))} mg`;
    } else if (reagent.form === "liquid") {
      if (!number(reagent.molecularWeight)) issues.push(`${reagent.name || "Reagent"}: MW is needed to calculate liquid mass.`);
      if (!number(reagent.density)) issues.push(`${reagent.name || "Reagent"}: density is needed to calculate liquid volume.`);
      if (number(reagent.molecularWeight) && number(reagent.density)) {
        const volumeUl = calculatedMmol * (reagent.molecularWeight as number) / (reagent.density as number);
        amount = volumeUl >= 1000 ? `${fmt(volumeUl / 1000)} mL` : `${fmt(volumeUl)} uL`;
      }
    } else {
      if (!number(reagent.stockConcentration)) issues.push(`${reagent.name || "Reagent"}: stock concentration is needed to calculate solution volume.`);
      else {
        const volumeUl = calculatedMmol / (reagent.stockConcentration as number) * 1000;
        amount = volumeUl >= 1000 ? `${fmt(volumeUl / 1000)} mL` : `${fmt(volumeUl)} uL`;
      }
    }
  }
  globalMissing.push(...issues);
  return { ...reagent, calculatedMmol, amount, issues };
}

function calculateSolventSummary(input: UniversalExperiment, totalVolumeMl: number | null, missing: string[], review: string[], assumptions: string[]) {
  const active = input.solvents.filter((solvent) => solvent.name.trim());
  if (!active.length) return "No solvent system entered.";
  const percentages = active.filter((solvent) => solvent.mode === "percent");
  const volumes = active.filter((solvent) => solvent.mode === "volume");
  if (percentages.length) {
    const total = percentages.reduce((sum, solvent) => sum + (solvent.value ?? 0), 0);
    if (total !== 100) review.push(`Solvent percentages total ${fmt(total)}%; confirm the intended mixture.`);
    if (totalVolumeMl !== null && input.makeTotalVolume) assumptions.push("Percent solvent components use the calculated total reaction volume.");
  }
  if (input.makeTotalVolume && totalVolumeMl === null) missing.push("A limiting reagent amount and desired concentration are needed to calculate total solvent volume.");
  const parts = active.map((solvent) => {
    const value = solvent.value;
    if (solvent.mode === "percent" && input.makeTotalVolume && totalVolumeMl !== null && value !== undefined) return `${solvent.name} ${fmt(value)}% (${fmt(totalVolumeMl * value / 100)} mL)`;
    return `${solvent.name}${value !== undefined ? ` ${fmt(value)} ${solvent.mode === "percent" ? "%" : "mL"}` : ""}`;
  });
  return parts.join(" + ");
}

function unique(items: string[]) { return [...new Set(items)]; }

export function makeUniversalProtocol(input: UniversalExperiment, plan: UniversalPlan) {
  const reagentSteps = plan.reagents.filter((reagent) => reagent.calculationMode !== "informational").map((reagent, index) => `${index + 4}. Add ${reagent.name || "reagent"}: ${reagent.amount}. Confirm order of addition before execution.`);
  const analysis = input.analysis === "none" ? "Record observations and deviations using the approved documentation process." : `Prepare the selected ${input.analysis === "custom" ? input.analysisCustom || "custom" : input.analysis} analysis according to the approved method.`;
  return [
    "Draft protocol — edit and verify against the approved method before bench work.",
    `1. Label a clean vessel for ${input.name || "this experiment"} and review source instructions, SDS, and local SOPs.`,
    `2. Charge ${input.limitingName || "the limiting reagent"}${plan.limitingMmol !== null ? ` (${fmt(plan.limitingMmol)} mmol)` : ""}.`,
    `3. Prepare the solvent system: ${plan.solventSummary}`,
    ...reagentSteps,
    `${reagentSteps.length + 4}. Apply the planned conditions${input.temperature ? ` at ${input.temperature}` : ""}${input.time ? ` for ${input.time}` : ""}.`,
    `${reagentSteps.length + 5}. ${analysis}`,
    `${reagentSteps.length + 6}. Record observations, deviations, calculations, and analysis notes in the experiment record.`
  ].join("\n\n");
}
