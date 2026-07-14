export type UnitDimension = "volume" | "mass" | "amount" | "molar" | "mass_concentration" | "percent";
export type RoundingMode = "automatic" | "fixed" | "full" | "practical";

type UnitDefinition = { dimension: UnitDimension; factor: number; label: string; base: string };

export const unitDefinitions: Record<string, UnitDefinition> = {
  L: { dimension: "volume", factor: 1, label: "L", base: "L" }, mL: { dimension: "volume", factor: 1e-3, label: "mL", base: "L" }, uL: { dimension: "volume", factor: 1e-6, label: "uL", base: "L" }, nL: { dimension: "volume", factor: 1e-9, label: "nL", base: "L" },
  kg: { dimension: "mass", factor: 1e3, label: "kg", base: "g" }, g: { dimension: "mass", factor: 1, label: "g", base: "g" }, mg: { dimension: "mass", factor: 1e-3, label: "mg", base: "g" }, ug: { dimension: "mass", factor: 1e-6, label: "ug", base: "g" }, ng: { dimension: "mass", factor: 1e-9, label: "ng", base: "g" },
  mol: { dimension: "amount", factor: 1, label: "mol", base: "mol" }, mmol: { dimension: "amount", factor: 1e-3, label: "mmol", base: "mol" }, umol: { dimension: "amount", factor: 1e-6, label: "umol", base: "mol" }, nmol: { dimension: "amount", factor: 1e-9, label: "nmol", base: "mol" },
  M: { dimension: "molar", factor: 1, label: "M", base: "mol/L" }, "mol/L": { dimension: "molar", factor: 1, label: "mol/L", base: "mol/L" }, mM: { dimension: "molar", factor: 1e-3, label: "mM", base: "mol/L" }, "mmol/L": { dimension: "molar", factor: 1e-3, label: "mmol/L", base: "mol/L" }, uM: { dimension: "molar", factor: 1e-6, label: "uM", base: "mol/L" }, "umol/L": { dimension: "molar", factor: 1e-6, label: "umol/L", base: "mol/L" }, nM: { dimension: "molar", factor: 1e-9, label: "nM", base: "mol/L" }, "nmol/L": { dimension: "molar", factor: 1e-9, label: "nmol/L", base: "mol/L" },
  "g/L": { dimension: "mass_concentration", factor: 1, label: "g/L", base: "g/L" }, "mg/mL": { dimension: "mass_concentration", factor: 1, label: "mg/mL", base: "g/L" }, "mg/L": { dimension: "mass_concentration", factor: 1e-3, label: "mg/L", base: "g/L" }, "ug/mL": { dimension: "mass_concentration", factor: 1e-3, label: "ug/mL", base: "g/L" }, "ng/mL": { dimension: "mass_concentration", factor: 1e-6, label: "ng/mL", base: "g/L" },
  "% w/v": { dimension: "percent", factor: 1, label: "% w/v", base: "% w/v" }, "% v/v": { dimension: "percent", factor: 1, label: "% v/v", base: "% v/v" }, "% w/w": { dimension: "percent", factor: 1, label: "% w/w", base: "% w/w" }
};

export const unitGroups: { label: string; units: string[] }[] = [
  { label: "Volume", units: ["L", "mL", "uL", "nL"] }, { label: "Mass", units: ["kg", "g", "mg", "ug", "ng"] }, { label: "Amount", units: ["mol", "mmol", "umol", "nmol"] }, { label: "Molar concentration", units: ["M", "mol/L", "mM", "mmol/L", "uM", "umol/L", "nM", "nmol/L"] }, { label: "Mass concentration", units: ["g/L", "mg/mL", "mg/L", "ug/mL", "ng/mL"] }, { label: "Percentage", units: ["% w/v", "% v/v", "% w/w"] }
];

function valid(value: number, label: string) { if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative finite number.`); }
function definition(unit: string) { const item = unitDefinitions[unit]; if (!item) throw new Error(`Unsupported unit: ${unit}.`); return item; }
export function compatibleUnits(from: string, to: string) { return definition(from).dimension === definition(to).dimension; }

export function convertUnits(value: number, from: string, to: string) {
  valid(value, "Value"); const source = definition(from); const target = definition(to);
  if (source.dimension !== target.dimension) {
    if ((source.dimension === "molar" && target.dimension === "mass_concentration") || (source.dimension === "mass_concentration" && target.dimension === "molar")) throw new Error("Cannot convert mass concentration to molar concentration without the compound's molecular weight.");
    throw new Error(`${from} and ${to} are incompatible dimensions.`);
  }
  const factor = normalize(source.factor / target.factor);
  const result = normalize(value * factor);
  if (!Number.isFinite(result)) throw new Error("Calculation produced a non-finite result.");
  const direction = factor > 1 ? "multiply" : factor < 1 ? "divide" : "keep the numerical value unchanged";
  const relationship = factor >= 1 ? `1 ${from} = ${formatRaw(factor)} ${to}` : `1 ${to} = ${formatRaw(1 / factor)} ${from}`;
  return { value: result, factor, relationship, direction, formula: `${formatRaw(value)} ${from} × (${formatRaw(factor)} ${to} / 1 ${from}) = ${formatRaw(result)} ${to}`, arithmetic: `${formatRaw(value)} × ${formatRaw(factor)} = ${formatRaw(result)}`, explanation: factor > 1 ? `${from} is larger than ${to}, so the numerical value increases by multiplication.` : factor < 1 ? `${from} is smaller than ${to}, so the numerical value decreases by division.` : "The two unit labels are equivalent." };
}

export function molesFromMass(mass: number, massUnit: string, molecularWeight: number) {
  valid(mass, "Mass"); if (!(molecularWeight > 0) || !Number.isFinite(molecularWeight)) throw new Error("Molecular weight must be a positive finite number.");
  const massG = convertUnits(mass, massUnit, "g").value; const mol = massG / molecularWeight;
  return { mol, steps: [`${formatRaw(mass)} ${massUnit} × (${formatRaw(unitDefinitions[massUnit].factor)} g / 1 ${massUnit}) = ${formatRaw(massG)} g`, `n = m / MW = ${formatRaw(massG)} g / ${formatRaw(molecularWeight)} g/mol = ${formatRaw(mol)} mol`], formula: "n = m / MW" };
}

export function molarityFromAmount(amount: number, amountUnit: string, volume: number, volumeUnit: string) {
  const mol = convertUnits(amount, amountUnit, "mol").value; const liters = convertUnits(volume, volumeUnit, "L").value; if (!(liters > 0)) throw new Error("Volume must be greater than zero."); const result = mol / liters;
  const crossCheck = (amount * unitDefinitions[amountUnit].factor) / (volume * unitDefinitions[volumeUnit].factor);
  if (Math.abs(result - crossCheck) > Math.max(1e-12, Math.abs(result) * 1e-12)) throw new Error("Internal cross-check failed. Result was not displayed.");
  return { valueM: result, steps: [`${formatRaw(amount)} ${amountUnit} = ${formatRaw(mol)} mol`, `${formatRaw(volume)} ${volumeUnit} = ${formatRaw(liters)} L`, `C = n / V = ${formatRaw(mol)} mol / ${formatRaw(liters)} L = ${formatRaw(result)} M`], formula: "C = n / V" };
}

export function dilutionPlan(stock: number, stockUnit: string, target: number, targetUnit: string, finalVolume: number, volumeUnit: string) {
  const c1 = convertUnits(stock, stockUnit, "M").value; const c2 = convertUnits(target, targetUnit, "M").value; const v2L = convertUnits(finalVolume, volumeUnit, "L").value;
  if (!(c1 > 0) || !(c2 > 0) || !(v2L > 0)) throw new Error("Stock concentration, target concentration, and final volume must be positive.");
  if (c2 > c1) throw new Error("Target concentration cannot be higher than stock concentration using dilution alone. Prepare a more concentrated stock or use a concentration step.");
  const v1L = c2 * v2L / c1; const diluentL = v2L - v1L;
  return { stockVolume: convertUnits(v1L, "L", volumeUnit).value, diluentVolume: convertUnits(diluentL, "L", volumeUnit).value, formula: "C1V1 = C2V2; V1 = C2V2 / C1", steps: [`${formatRaw(stock)} ${stockUnit} = ${formatRaw(c1)} M`, `${formatRaw(target)} ${targetUnit} = ${formatRaw(c2)} M`, `${formatRaw(finalVolume)} ${volumeUnit} = ${formatRaw(v2L)} L`, `V1 = (${formatRaw(c2)} M × ${formatRaw(v2L)} L) / ${formatRaw(c1)} M = ${formatRaw(v1L)} L`] };
}

export function practicalPipetteWarning(volumeUl: number) { if (volumeUl < 0.5) return "This volume cannot be measured accurately with a standard micropipette. Prepare an intermediate dilution first."; if (volumeUl <= 10) return "A P10 range may be suitable; use the lab's validated pipette and technique."; return null; }
export function formatDisplay(value: number, mode: RoundingMode, decimals = 3) { if (!Number.isFinite(value)) return "Invalid"; if (mode === "full") return formatRaw(value); if (mode === "fixed") return value.toFixed(decimals); if (mode === "practical") return Math.abs(value) < 10 ? value.toFixed(1) : value.toPrecision(3); return Number(value.toPrecision(4)).toString(); }
function normalize(value: number) { return Number(value.toPrecision(15)); }
function formatRaw(value: number) { return Number(value.toPrecision(12)).toString(); }
