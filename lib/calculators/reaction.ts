import { assertPositive } from "./validation";

export type ReagentRole = "reactant" | "coupling reagent" | "base" | "acid" | "additive" | "solvent";
export type ReagentState = "solid" | "liquid" | "solution";

export type ReactionReagentInput = {
  id: string;
  name: string;
  role: ReagentRole;
  notes?: string;
  molecularWeight?: number;
  equivalents: number;
  density?: number;
  state: ReagentState;
  stockConcentration?: number;
};

export type ReactionPlanInput = {
  reactionName: string;
  targetProductName: string;
  limitingReagent: string;
  limitingMassMg: number;
  limitingMolecularWeight: number;
  targetConcentrationM: number;
  solvent: string;
  reactionTemperature: string;
  reactionTime: string;
  notes: string;
  productMolecularWeight: number;
  observedMz?: number;
  mzTolerance: number;
  crudeSampleVolumeUl: number;
  lcmsFinalVolumeUl: number;
  reagents: ReactionReagentInput[];
};

export type ReactionReagentOutput = ReactionReagentInput & {
  mmol: number | null;
  massMg: number | null;
  liquidVolumeUl: number | null;
  stockSolutionVolumeUl: number | null;
  displayAmount: string;
  missingData: string[];
};

export type LcmsExpectedMass = {
  label: string;
  value: number;
  differenceDa: number | null;
  matches: boolean;
};

export type ReactionPlanOutput = {
  limitingMmol: number;
  totalReactionVolumeMl: number;
  approximateSolventVolumeMl: number;
  theoreticalYieldMg: number;
  reagents: ReactionReagentOutput[];
  missingData: string[];
  warnings: string[];
  protocolSteps: string[];
  lcmsMasses: LcmsExpectedMass[];
  lcmsSamplePrep: string;
};

const safetyKeywordReminders = [
  { keyword: "dmf", message: "DMF: Use gloves and fume hood; reproductive toxicity concern." },
  { keyword: "dmso", message: "DMSO: Can enhance skin absorption of dissolved compounds." },
  { keyword: "dcm", message: "DCM: Volatile chlorinated solvent; use in fume hood." },
  { keyword: "dichloromethane", message: "DCM: Volatile chlorinated solvent; use in fume hood." },
  { keyword: "dipea", message: "DIPEA: Irritating/corrosive base; use in fume hood." },
  { keyword: "hatu", message: "HATU: Coupling reagent; avoid inhalation and skin contact." },
  { keyword: "azide", message: "Azide: Handle carefully; avoid acidification and metal contamination when relevant." },
  { keyword: "tfa", message: "TFA: Strong volatile acid; corrosive." },
  { keyword: "acn", message: "ACN/acetonitrile: Flammable and toxic; use in fume hood." },
  { keyword: "acetonitrile", message: "ACN/acetonitrile: Flammable and toxic; use in fume hood." }
];

export function calculateLimitingMmol(massMg: number, molecularWeight: number) {
  assertPositive(massMg, "limiting reagent mass");
  assertPositive(molecularWeight, "limiting reagent molecular weight");
  return massMg / molecularWeight;
}

export function calculateReactionPlan(input: ReactionPlanInput): ReactionPlanOutput {
  const missingData: string[] = [];
  const warnings: string[] = [];

  validatePositive(input.limitingMassMg, "Limiting reagent mass", missingData);
  validatePositive(input.limitingMolecularWeight, "Limiting reagent molecular weight", missingData);
  validatePositive(input.targetConcentrationM, "Desired reaction concentration", missingData);
  validatePositive(input.productMolecularWeight, "Neutral product molecular weight", missingData);

  if (!input.solvent.trim()) missingData.push("Missing solvent.");
  if (!input.reactionTemperature.trim()) missingData.push("Missing temperature.");
  if (!input.reactionTime.trim()) missingData.push("Missing reaction time.");
  if (input.targetConcentrationM > 0 && input.targetConcentrationM < 0.01) warnings.push("Very low concentration below 0.01 M; confirm reaction rate and analytical sensitivity.");
  if (input.targetConcentrationM > 1) warnings.push("Very high concentration above 1 M; confirm solubility, stirring, and heat release.");

  const limitingMmol = input.limitingMassMg > 0 && input.limitingMolecularWeight > 0
    ? calculateLimitingMmol(input.limitingMassMg, input.limitingMolecularWeight)
    : 0;
  const totalReactionVolumeMl = input.targetConcentrationM > 0 ? limitingMmol / input.targetConcentrationM : 0;
  const theoreticalYieldMg = input.productMolecularWeight > 0 ? limitingMmol * input.productMolecularWeight : 0;

  const reagents = input.reagents.map((reagent) => calculateReagent(reagent, limitingMmol, missingData));
  const reagentLiquidVolumeMl = reagents.reduce((sum, reagent) => {
    const volumeUl = reagent.state === "liquid" ? reagent.liquidVolumeUl : reagent.state === "solution" ? reagent.stockSolutionVolumeUl : null;
    return sum + (volumeUl ?? 0) / 1000;
  }, 0);
  const approximateSolventVolumeMl = Math.max(totalReactionVolumeMl - reagentLiquidVolumeMl, 0);

  const safetyText = [input.solvent, input.notes, ...input.reagents.map((reagent) => reagent.name)].join(" ").toLowerCase();
  for (const reminder of safetyKeywordReminders) {
    if (safetyText.includes(reminder.keyword)) warnings.push(reminder.message);
  }
  warnings.push("Safety notes are preliminary reminders. Always check SDS and follow institutional rules.");

  const lcmsMasses = calculateLcmsMasses(input.productMolecularWeight, input.observedMz, input.mzTolerance);
  const lcmsSamplePrep = makeLcmsSamplePrep(input.crudeSampleVolumeUl, input.lcmsFinalVolumeUl);
  const outputWithoutProtocol = {
    limitingMmol,
    totalReactionVolumeMl,
    approximateSolventVolumeMl,
    theoreticalYieldMg,
    reagents,
    missingData: [...new Set(missingData)],
    warnings: [...new Set(warnings)],
    protocolSteps: [] as string[],
    lcmsMasses,
    lcmsSamplePrep
  };

  return {
    ...outputWithoutProtocol,
    protocolSteps: generateProtocolSteps(input, outputWithoutProtocol)
  };
}

function calculateReagent(reagent: ReactionReagentInput, limitingMmol: number, globalMissingData: string[]): ReactionReagentOutput {
  const missingData: string[] = [];
  validatePositive(reagent.equivalents, `${reagent.name} equivalents`, missingData);
  if (!reagent.molecularWeight || reagent.molecularWeight <= 0) missingData.push(`${reagent.name}: missing molecular weight.`);
  if (reagent.state === "liquid" && (!reagent.density || reagent.density <= 0)) missingData.push(`${reagent.name}: missing density for liquid volume.`);
  if (reagent.state === "solution" && (!reagent.stockConcentration || reagent.stockConcentration <= 0)) missingData.push(`${reagent.name}: missing stock concentration for solution.`);

  const mmol = limitingMmol > 0 && reagent.equivalents > 0 ? limitingMmol * reagent.equivalents : null;
  const massMg = mmol !== null && reagent.molecularWeight && reagent.molecularWeight > 0 ? mmol * reagent.molecularWeight : null;
  const liquidVolumeUl = massMg !== null && reagent.density && reagent.density > 0 ? (massMg / 1000 / reagent.density) * 1000 : null;
  const stockSolutionVolumeUl = mmol !== null && reagent.stockConcentration && reagent.stockConcentration > 0 ? (mmol / reagent.stockConcentration) * 1000 : null;

  globalMissingData.push(...missingData);

  return {
    ...reagent,
    mmol,
    massMg,
    liquidVolumeUl,
    stockSolutionVolumeUl,
    displayAmount: getDisplayAmount(reagent.state, massMg, liquidVolumeUl, stockSolutionVolumeUl),
    missingData
  };
}

function getDisplayAmount(state: ReagentState, massMg: number | null, liquidVolumeUl: number | null, stockSolutionVolumeUl: number | null) {
  if (state === "solid") return massMg === null ? "missing data" : `${formatNumber(massMg)} mg`;
  if (state === "liquid") return liquidVolumeUl === null ? "missing data" : `${formatNumber(liquidVolumeUl)} uL`;
  return stockSolutionVolumeUl === null ? "missing data" : `${formatNumber(stockSolutionVolumeUl)} uL`;
}

function validatePositive(value: number | undefined, label: string, missingData: string[]) {
  if (value === undefined || value <= 0 || Number.isNaN(value)) missingData.push(`${label}: zero, negative, or missing value.`);
}

export function calculateLcmsMasses(productMw: number, observedMz = 0, tolerance = 0.5): LcmsExpectedMass[] {
  const masses = [
    ["[M+H]+", productMw + 1.0073],
    ["[M+Na]+", productMw + 22.9898],
    ["[M+K]+", productMw + 38.9637],
    ["[M-H]-", productMw - 1.0073]
  ] as const;

  return masses.map(([label, value]) => {
    const differenceDa = observedMz > 0 ? observedMz - value : null;
    return {
      label,
      value,
      differenceDa,
      matches: differenceDa !== null && Math.abs(differenceDa) <= tolerance
    };
  });
}

export function makeLcmsSamplePrep(crudeVolumeUl: number, finalVolumeUl: number) {
  const diluentVolume = Math.max(finalVolumeUl - crudeVolumeUl, 0);
  return `Add ${formatNumber(crudeVolumeUl)} uL crude reaction mixture to ${formatNumber(diluentVolume)} uL ACN:H2O 1:1 to make ${formatNumber(finalVolumeUl)} uL final volume. Mix thoroughly. Filter if required before LCMS injection.`;
}

export function generateProtocolSteps(input: ReactionPlanInput, output: Omit<ReactionPlanOutput, "protocolSteps">) {
  return [
    "Draft protocol - verify with supervisor before use.",
    `Label a clean reaction vessel for ${input.reactionName || "the planned reaction"}.`,
    `Add ${formatNumber(input.limitingMassMg)} mg ${input.limitingReagent || "limiting reagent"} (${formatNumber(output.limitingMmol)} mmol).`,
    `Add approximately ${formatNumber(output.approximateSolventVolumeMl)} mL ${input.solvent || "selected solvent"} to target ${formatNumber(input.targetConcentrationM)} M.`,
    "Mix until the limiting reagent is dissolved or evenly suspended.",
    ...output.reagents.map((reagent) => `Add ${reagent.name} (${reagent.role}, ${formatNumber(reagent.equivalents)} equiv): ${reagent.displayAmount}.`),
    `Stir at ${input.reactionTemperature || "the selected temperature"} for ${input.reactionTime || "the selected reaction time"}.`,
    `Prepare LCMS sample: ${output.lcmsSamplePrep}`,
    "Record observations, deviations, LCMS results, and supervisor feedback in the lab notebook."
  ];
}

export function makeReagentCsv(reagents: ReactionReagentOutput[]) {
  const header = ["Reagent", "Role", "State", "Equiv", "mmol", "Mass mg", "Liquid volume uL", "Stock solution volume uL", "Display amount"];
  const rows = reagents.map((reagent) => [
    reagent.name,
    reagent.role,
    reagent.state,
    reagent.equivalents,
    reagent.mmol ?? "",
    reagent.massMg ?? "",
    reagent.liquidVolumeUl ?? "",
    reagent.stockSolutionVolumeUl ?? "",
    reagent.displayAmount
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}

function formatNumber(value: number, digits = 4) {
  return Number.isFinite(value) ? Number(value.toPrecision(digits)).toString() : "missing data";
}
