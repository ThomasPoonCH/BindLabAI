import { convertUnits, unitDefinitions } from "./engine";

export type PartsMode = "per_reference" | "component_ratio" | "in_total" | "add_to" | "percent_vv";
export type Interpretation = "per_b" | "in_final" | "added_to_b";

export function normalizeUnit(unit: string) {
  const normalized = unit.trim().replaceAll("µ", "u").replace(/^ul$/i, "uL").replace(/^ug$/i, "ug").replace(/^umol$/i, "umol");
  return normalized === "uL" || normalized === "ug" || normalized === "umol" ? normalized : unit;
}

function positive(value: number, label: string) { if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be a positive finite number.`); }
function volumePractical(value: number, unit: string) {
  const inMl = convertUnits(value, normalizeUnit(unit), "mL").value;
  if (inMl >= 1000) return { value: inMl / 1000, unit: "L" };
  if (inMl > 0 && inMl < 1) return { value: inMl * 1000, unit: "uL" };
  return { value: inMl, unit: "mL" };
}

export function calculatePerReference({ referenceA, unitA, referenceB, unitB, actualB, actualBUnit }: { referenceA: number; unitA: string; referenceB: number; unitB: string; actualB: number; actualBUnit: string }) {
  positive(referenceA, "Reference amount A"); positive(referenceB, "Reference amount B"); positive(actualB, "Actual amount B");
  const normalizedA = normalizeUnit(unitA); const normalizedB = normalizeUnit(unitB); const normalizedActualB = normalizeUnit(actualBUnit);
  const actualInReferenceB = convertUnits(actualB, normalizedActualB, normalizedB).value;
  const amountA = actualInReferenceB * referenceA / referenceB;
  return { amountA, unitA: normalizedA, actualInReferenceB, unitB: normalizedB, formula: "Required A = Actual B × Reference A / Reference B", substitution: `${actualInReferenceB} ${normalizedB} × ${referenceA} ${normalizedA} / ${referenceB} ${normalizedB}`, cancellation: `The ${normalizedB} units for B cancel, leaving ${normalizedA} for A.`, practical: unitDefinitions[normalizedA]?.dimension === "volume" ? volumePractical(amountA, normalizedA) : null };
}

export function calculateComponentRatio(partA: number, partB: number, finalVolume: number, unit: string) { positive(partA, "Part A"); positive(partB, "Part B"); positive(finalVolume, "Final total volume"); const total = partA + partB; return { amountA: finalVolume * partA / total, amountB: finalVolume * partB / total, totalParts: total, unit: normalizeUnit(unit), formula: "A = final volume × A parts / (A parts + B parts)" }; }
export function calculateInTotal(partA: number, totalParts: number, finalVolume: number, unit: string) { positive(partA, "Parts of A"); positive(totalParts, "Total parts"); positive(finalVolume, "Final total volume"); if (partA >= totalParts) throw new Error("Parts of A must be smaller than total parts when a remaining solvent is required."); const amountA = finalVolume * partA / totalParts; return { amountA, amountB: finalVolume - amountA, unit: normalizeUnit(unit), formula: "A = final total volume × A parts / total parts" }; }
export function calculateAddTo(partA: number, partB: number, amountB: number, unit: string) { positive(partA, "Parts of A"); positive(partB, "Parts of B"); positive(amountB, "Available amount B"); const amountA = amountB * partA / partB; return { amountA, amountB, combined: amountA + amountB, unit: normalizeUnit(unit), formula: "A = available B × A parts / B parts" }; }
export function calculatePercentVv(percent: number, finalVolume: number, unit: string) { if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error("Percentage must be between 0 and 100."); positive(finalVolume, "Final solution volume"); const amountA = percent / 100 * finalVolume; return { amountA, amountB: finalVolume - amountA, unit: normalizeUnit(unit), formula: "reagent volume = percentage / 100 × final final volume" }; }
