export type MassUnit = "ug" | "mg" | "g";
export type AmountUnit = "nmol" | "umol" | "mmol" | "mol";
export type VolumeUnit = "uL" | "mL" | "L";
export type ConcentrationUnit = "uM" | "mM" | "M";
export type DensityUnit = "g/mL" | "mg/mL";
export type InputUnit = MassUnit | AmountUnit | VolumeUnit;
export type SupplyForm = "solid" | "liquid" | "stock_solution" | "gas" | "unknown";

export type CalculatorRow = {
  id: string;
  name: string;
  role: string;
  form: SupplyForm;
  molecularWeight: number | null;
  density: number | null;
  densityUnit: DensityUnit;
  stockConcentration: number | null;
  stockConcentrationUnit: ConcentrationUnit;
  equivalents: number | null;
  inputValue: number | null;
  inputUnit: InputUnit | null;
  purityPercent: number | null;
  isReference: boolean;
};

export type Explanation = { label: string; formula: string; substituted: string; result: string };
export type CalculatedRow = CalculatorRow & {
  amountUmol: number | null;
  actualConcentrationM: number | null;
  theoreticalMassMg: number | null;
  correctedMassMg: number | null;
  liquidVolumeUl: number | null;
  stockVolumeUl: number | null;
  errors: string[];
  warnings: string[];
  explanations: Explanation[];
};

export type ReactionPlan = {
  referenceAmountUmol: number | null;
  concentrationBasisReagentId: string | null;
  concentrationBasisName: string | null;
  totalVolumeMl: number | null;
  actualConcentrationM: number | null;
  rows: CalculatedRow[];
  errors: string[];
  warnings: string[];
  solventExplanation: Explanation | null;
};

const positive = (value: number | null) => value !== null && Number.isFinite(value) && value > 0;
const nonNegative = (value: number | null) => value === null || (Number.isFinite(value) && value >= 0);
const finiteOrNull = (value: number) => Number.isFinite(value) && value >= 0 ? value : null;
const unique = (items: string[]) => [...new Set(items)];
export const formatNumber = (value: number, digits = 6) => Number(value.toPrecision(digits)).toString();

export function massToMg(value: number, unit: MassUnit) { return unit === "ug" ? value / 1000 : unit === "g" ? value * 1000 : value; }
export function amountToUmol(value: number, unit: AmountUnit) { return unit === "nmol" ? value / 1000 : unit === "mmol" ? value * 1000 : unit === "mol" ? value * 1_000_000 : value; }
export function volumeToMl(value: number, unit: VolumeUnit) { return unit === "uL" ? value / 1000 : unit === "L" ? value * 1000 : value; }
export function concentrationToM(value: number, unit: ConcentrationUnit) { return unit === "uM" ? value / 1_000_000 : unit === "mM" ? value / 1000 : value; }
export function densityToGPerMl(value: number, unit: DensityUnit) { return unit === "mg/mL" ? value / 1000 : value; }

export function amountFromMass(massMg: number, molecularWeight: number) {
  if (!positive(massMg) || !positive(molecularWeight)) return null;
  return finiteOrNull(massMg / molecularWeight * 1000);
}
export function reagentAmount(referenceUmol: number, equivalents: number) {
  if (!positive(referenceUmol) || !nonNegative(equivalents)) return null;
  return finiteOrNull(referenceUmol * equivalents);
}
export function massFromAmount(amountUmol: number, molecularWeight: number) {
  if (!nonNegative(amountUmol) || !positive(molecularWeight)) return null;
  return finiteOrNull(amountUmol * molecularWeight / 1000);
}
export function neatLiquidVolume(massMg: number, densityGPerMl: number) {
  if (!nonNegative(massMg) || !positive(densityGPerMl)) return null;
  return finiteOrNull(massMg / densityGPerMl);
}
export function stockVolumeUl(amountUmol: number, concentrationM: number) {
  if (!nonNegative(amountUmol) || !positive(concentrationM)) return null;
  return finiteOrNull(amountUmol / concentrationM);
}
export function solventVolumeMl(referenceUmol: number, concentrationM: number) {
  if (!positive(referenceUmol) || !positive(concentrationM)) return null;
  return finiteOrNull(referenceUmol / (concentrationM * 1000));
}
export function actualConcentrationM(amountUmol: number, totalVolumeMl: number) {
  if (!nonNegative(amountUmol) || !positive(totalVolumeMl)) return null;
  return finiteOrNull(amountUmol / (totalVolumeMl * 1000));
}
export function purityCorrectedMass(theoreticalMassMg: number, purityPercent: number | null) {
  if (purityPercent === null) return theoreticalMassMg;
  if (!positive(theoreticalMassMg) || !positive(purityPercent) || purityPercent > 100) return null;
  return finiteOrNull(theoreticalMassMg / (purityPercent / 100));
}

function directAmount(row: CalculatorRow, errors: string[]) {
  if (!positive(row.inputValue) || !row.inputUnit) return null;
  if (row.purityPercent !== null && (!positive(row.purityPercent) || row.purityPercent > 100)) { errors.push("Reference purity must be greater than 0% and at most 100%."); return null; }
  if (["nmol", "umol", "mmol", "mol"].includes(row.inputUnit)) return finiteOrNull(amountToUmol(row.inputValue!, row.inputUnit as AmountUnit));
  if (["ug", "mg", "g"].includes(row.inputUnit)) {
    if (!positive(row.molecularWeight)) { errors.push(`${row.name || "Reagent"}: MW unavailable until reagent identity is confirmed.`); return null; }
    if (row.purityPercent !== null && (!positive(row.purityPercent) || row.purityPercent > 100)) { errors.push("Reference purity must be greater than 0% and at most 100%."); return null; }
    return amountFromMass(massToMg(row.inputValue!, row.inputUnit as MassUnit) * (row.purityPercent === null ? 1 : row.purityPercent / 100), row.molecularWeight!);
  }
  if (["uL", "mL", "L"].includes(row.inputUnit)) {
    if (row.form === "stock_solution") {
      if (!positive(row.stockConcentration)) { errors.push(`${row.name || "Reagent"}: stock concentration is required.`); return null; }
      return finiteOrNull(volumeToMl(row.inputValue!, row.inputUnit as VolumeUnit) * concentrationToM(row.stockConcentration!, row.stockConcentrationUnit) * 1000);
    }
    if (!positive(row.density)) { errors.push(`${row.name || "Reagent"}: density is required for volume calculation.`); return null; }
    if (!positive(row.molecularWeight)) { errors.push(`${row.name || "Reagent"}: MW unavailable until reagent identity is confirmed.`); return null; }
    const massMg = volumeToMl(row.inputValue!, row.inputUnit as VolumeUnit) * densityToGPerMl(row.density!, row.densityUnit) * 1000;
    return amountFromMass(massMg * (row.purityPercent === null ? 1 : row.purityPercent / 100), row.molecularWeight!);
  }
  return null;
}

export function calculateReactionPlan(rows: CalculatorRow[], targetConcentration: number | null, targetUnit: ConcentrationUnit, concentrationBasisReagentId: string | null = null): ReactionPlan {
  const errors: string[] = [];
  const warnings: string[] = [];
  const references = rows.filter((row) => row.isReference && row.role !== "product");
  if (references.length === 0) errors.push("Choose one limiting reagent.");
  if (references.length > 1) errors.push("Choose exactly one confirmed reference reagent.");
  const reference = references[0];
  const referenceErrors: string[] = [];
  const referenceAmountUmol = reference ? directAmount(reference, referenceErrors) : null;
  errors.push(...referenceErrors);
  if (reference && referenceAmountUmol === null) errors.push(`${reference.name || "Reference reagent"}: enter a positive mass or amount with compatible units.`);

  const calculatedRows = rows.filter((row) => row.role !== "product" && row.role !== "solvent").map((row): CalculatedRow => {
    const rowErrors: string[] = [];
    const rowWarnings: string[] = [];
    const explanations: Explanation[] = [];
    if (!nonNegative(row.equivalents)) rowErrors.push(`${row.name || "Reagent"}: equivalents cannot be negative.`);
    if (row.purityPercent !== null && (!positive(row.purityPercent) || row.purityPercent > 100)) rowErrors.push(`${row.name || "Reagent"}: purity must be greater than 0% and at most 100%.`);
    if (row.molecularWeight !== null && !positive(row.molecularWeight)) rowErrors.push(`${row.name || "Reagent"}: MW must be greater than zero.`);
    if (row.density !== null && !positive(row.density)) rowErrors.push(`${row.name || "Reagent"}: density must be greater than zero.`);
    if (row.stockConcentration !== null && !positive(row.stockConcentration)) rowErrors.push(`${row.name || "Reagent"}: stock concentration must be greater than zero.`);

    let amountUmol = row.isReference ? referenceAmountUmol : null;
    if (!row.isReference) {
      if (row.equivalents === null) {
        rowErrors.push(`${row.name || "Reagent"}: enter equivalents to calculate the required amount from the reference reagent.`);
      } else if (referenceAmountUmol !== null) {
        amountUmol = reagentAmount(referenceAmountUmol, row.equivalents);
        if (amountUmol !== null) explanations.push({ label: `${row.name}: required amount`, formula: "n reagent (umol) = n reference (umol) x equivalents", substituted: `${formatNumber(referenceAmountUmol)} umol x ${row.equivalents}`, result: `${formatNumber(amountUmol)} umol` });
      }
    }
    if (row.isReference && amountUmol !== null && row.inputValue !== null && row.inputUnit && ["ug", "mg", "g"].includes(row.inputUnit) && row.molecularWeight) {
      explanations.push({ label: `${row.name}: amount`, formula: "amount (umol) = mass (mg) x purity fraction / MW (g/mol) x 1000 (nominal if purity unspecified)", substituted: `${formatNumber(massToMg(row.inputValue, row.inputUnit as MassUnit))} mg x ${row.purityPercent === null ? "1 (nominal; purity unspecified)" : row.purityPercent / 100} / ${row.molecularWeight} g/mol x 1000`, result: `${formatNumber(amountUmol)} umol` });
    }
    const theoreticalMassMg = amountUmol !== null && positive(row.molecularWeight) ? massFromAmount(amountUmol, row.molecularWeight!) : null;
    if (amountUmol !== null && theoreticalMassMg === null && row.form !== "gas") rowErrors.push(`${row.name || "Reagent"}: MW unavailable until reagent identity is confirmed.`);
    if (theoreticalMassMg !== null) explanations.push({ label: `${row.name}: theoretical mass`, formula: "mass (mg) = amount (umol) x MW (g/mol) / 1000", substituted: `${formatNumber(amountUmol!)} umol x ${row.molecularWeight} g/mol / 1000`, result: `${formatNumber(theoreticalMassMg)} mg` });
    const correctedMassMg = theoreticalMassMg !== null ? purityCorrectedMass(theoreticalMassMg, row.purityPercent) : null;
    if (theoreticalMassMg !== null && row.purityPercent !== null && correctedMassMg !== null) explanations.push({ label: `${row.name}: purity-corrected mass`, formula: "corrected mass = theoretical mass / purity fraction", substituted: `${formatNumber(theoreticalMassMg)} mg / ${row.purityPercent / 100}`, result: `${formatNumber(correctedMassMg)} mg` });
    const liquidVolumeUl = row.form === "liquid" && correctedMassMg !== null && positive(row.density) ? neatLiquidVolume(correctedMassMg, densityToGPerMl(row.density!, row.densityUnit)) : null;
    if (row.form === "liquid" && correctedMassMg !== null && liquidVolumeUl === null) rowErrors.push(`${row.name || "Liquid reagent"}: density is required for volume calculation.`);
    if (liquidVolumeUl !== null) explanations.push({ label: `${row.name}: neat-liquid volume`, formula: "volume (uL) = mass (mg) / density (g/mL)", substituted: `${formatNumber(correctedMassMg!)} mg / ${formatNumber(densityToGPerMl(row.density!, row.densityUnit))} g/mL`, result: `${formatNumber(liquidVolumeUl)} uL` });
    const stockVolume = row.form === "stock_solution" && amountUmol !== null && positive(row.stockConcentration) ? stockVolumeUl(amountUmol, concentrationToM(row.stockConcentration!, row.stockConcentrationUnit)) : null;
    if (row.form === "stock_solution" && amountUmol !== null && stockVolume === null) rowErrors.push(`${row.name || "Stock reagent"}: stock concentration is required.`);
    if (stockVolume !== null) explanations.push({ label: `${row.name}: stock volume`, formula: "volume (uL) = amount (umol) / concentration (M)", substituted: `${formatNumber(amountUmol!)} umol / ${formatNumber(concentrationToM(row.stockConcentration!, row.stockConcentrationUnit))} M`, result: `${formatNumber(stockVolume)} uL` });
    if (amountUmol !== null && amountUmol < 0.1) rowWarnings.push(`${row.name}: calculated amount is below 0.1 umol; confirm practical handling.`);
    if (liquidVolumeUl !== null && liquidVolumeUl < 1) rowWarnings.push(`${row.name}: calculated volume is below 1 uL; consider an intermediate stock.`);
    if (row.purityPercent === null) rowWarnings.push(`${row.name}: purity not specified. Mass-derived amounts are nominal and masses are uncorrected for purity.`);
    if (row.isReference && !positive(referenceAmountUmol)) rowErrors.push(`${row.name}: calculation is outside the supported range or required inputs are missing.`);
    if (!row.isReference && referenceAmountUmol !== null && row.equivalents !== null && amountUmol === null) rowErrors.push(`${row.name}: calculated amount is outside the supported numerical range.`);
    errors.push(...rowErrors); warnings.push(...rowWarnings);
    return { ...row, amountUmol, actualConcentrationM: null, theoreticalMassMg, correctedMassMg, liquidVolumeUl, stockVolumeUl: stockVolume, errors: unique(rowErrors), warnings: unique(rowWarnings), explanations };
  });

  const concentrationM = targetConcentration !== null ? concentrationToM(targetConcentration, targetUnit) : null;
  if (targetConcentration !== null && !positive(concentrationM)) errors.push("Target concentration must be greater than zero.");
  const requestedBasis = concentrationBasisReagentId ? calculatedRows.find(row => row.id === concentrationBasisReagentId) : null;
  const referenceBasis = calculatedRows.find(row => row.isReference) ?? null;
  const concentrationBasis = requestedBasis ?? referenceBasis;
  if (concentrationBasisReagentId && !requestedBasis) warnings.push("The selected concentration-basis reagent is unavailable; the reference reagent is being used.");
  const basisAmountUmol = concentrationBasis?.amountUmol ?? null;
  const totalVolumeMl = basisAmountUmol !== null && concentrationM !== null ? solventVolumeMl(basisAmountUmol, concentrationM) : null;
  if (basisAmountUmol !== null && concentrationM !== null && totalVolumeMl === null) errors.push("Reaction volume is outside the supported numerical range.");
  const suppliedLiquidMl = calculatedRows.reduce((sum, row) => sum + (row.stockVolumeUl ?? row.liquidVolumeUl ?? 0) / 1000, 0);
  if (totalVolumeMl !== null && suppliedLiquidMl > totalVolumeMl * (1 + 1e-12)) errors.push("Supplied stock and liquid reagent volumes exceed the target final reaction volume. Use a different concentration or scale; dilution cannot achieve this target.");
  const actual = basisAmountUmol !== null && totalVolumeMl !== null ? actualConcentrationM(basisAmountUmol, totalVolumeMl) : null;
  const rowsWithConcentrations = calculatedRows.map(row => ({
    ...row,
    actualConcentrationM: row.amountUmol !== null && totalVolumeMl !== null ? actualConcentrationM(row.amountUmol, totalVolumeMl) : null,
  }));
  const solventExplanation = totalVolumeMl !== null ? { label: "Total reaction volume", formula: "volume (mL) = selected reagent amount (umol) / [target concentration (M) x 1000]", substituted: `${concentrationBasis?.name || "Selected reagent"}: ${formatNumber(basisAmountUmol!)} umol / [${formatNumber(concentrationM!)} M x 1000]`, result: `${formatNumber(totalVolumeMl)} mL` } : null;
  return { referenceAmountUmol, concentrationBasisReagentId: concentrationBasis?.id ?? null, concentrationBasisName: concentrationBasis?.name ?? null, totalVolumeMl, actualConcentrationM: actual, rows: rowsWithConcentrations, errors: unique(errors), warnings: unique(warnings), solventExplanation };
}
