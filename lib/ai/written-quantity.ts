// Parse explicit quantities only; retain original units alongside normalized amount.
export function parseWrittenQuantity(text: string | null) {
  if (!text) return {};
  const result: Record<string, number | string> = {};
  for (const match of text.matchAll(/(?:^|[\s,(])((?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*(mmol|[uµμ]mol|mol|mg|g|mL|[uµμ]L|L|mM|[uµμ]M|M|equiv|eq)\b/g)) {
    const value = Number(match[1]); if (!Number.isFinite(value) || value <= 0) continue;
    const unit = match[2].replace(/[µμ]/g, "u");
    if (unit === "mg" || unit === "g") Object.assign(result, { mass: value, massUnit: unit });
    else if (["mol", "mmol", "umol"].includes(unit)) result.amountMmol = value * (unit === "mol" ? 1000 : unit === "umol" ? 0.001 : 1);
    else if (["L", "mL", "uL"].includes(unit)) Object.assign(result, { volume: value, volumeUnit: unit });
    else if (["M", "mM", "uM"].includes(unit)) { if (/\bstock\b/i.test(text)) Object.assign(result, { stockConcentration: value, stockConcentrationUnit: unit }); }
    else result.equivalents = value;
  }
  return result;
}
