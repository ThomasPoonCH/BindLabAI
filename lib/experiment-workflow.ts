import type { ExperimentRecord } from "./ai/experiment-schema";
import { calculateExperiment } from "./chemistry/experiment-calculations";

export type Conflict = { field: string; current: string; incoming: string; reason: string };
export type Resolution = "keep" | "ai" | "manual";
const value = (v: unknown) => v === null || v === undefined ? "" : String(v);
export function findConflicts(current: ExperimentRecord, draft: ExperimentRecord): Conflict[] {
  const found: Conflict[] = [];
  const add = (field: Conflict["field"], oldValue: unknown, nextValue: unknown) => {
    if (value(oldValue) && value(nextValue) && value(oldValue) !== value(nextValue)) found.push({ field, current: value(oldValue), incoming: value(nextValue), reason: "Existing workspace value differs from the AI extraction." });
  };
  add("title", current.title, draft.title); add("objective", current.objective, draft.objective); add("reactionType", current.reactionType, draft.reactionType);
  add("solvent", current.conditions.solvent, draft.conditions.solvent); add("targetConcentration", current.conditions.targetConcentration === null ? null : `${current.conditions.targetConcentration} ${current.conditions.targetConcentrationUnit}`, draft.conditions.targetConcentration === null ? null : `${draft.conditions.targetConcentration} ${draft.conditions.targetConcentrationUnit}`);
  for (const field of ["temperature", "duration", "atmosphere", "vessel", "mixingMethod"] as const) add(field, current.conditions[field], draft.conditions[field]);
  for (const field of ["temperature", "duration"] as const) {
    const unit = field === "temperature" ? "temperatureUnit" : "durationUnit";
    if (!found.some(c => c.field === field) && current.conditions[field] && draft.conditions[field] && current.conditions[unit] !== draft.conditions[unit]) add(field, `${current.conditions[field]} ${current.conditions[unit]}`, `${draft.conditions[field]} ${draft.conditions[unit]}`);
  }
  add("workup", current.workup, draft.workup); add("purification", current.purification, draft.purification);
  for (const field of ["solventVolume", "vesselCapacity", "orderOfAddition"] as const) add(field, current.conditions[field], draft.conditions[field]);
  for (const [unit, amount] of [["solventVolumeUnit", "solventVolume"], ["vesselCapacityUnit", "vesselCapacity"]] as const) if (value(current.conditions[amount]) && value(draft.conditions[amount])) add(unit, current.conditions[unit], draft.conditions[unit]);
  for (const field of ["notes", "expectedProduct", "expectedMolecularWeight", "productStoichiometry", "analyticalMethods", "safetyNotes"] as const) add(field, current[field], draft[field]);
  for (const incoming of draft.reagents) {
    const existing = current.reagents.find(row => row.name?.trim().toLowerCase() === incoming.name?.trim().toLowerCase());
    if (!existing) continue;
    for (const field of ["molecularWeight", "mass", "massUnit", "volume", "volumeUnit", "amountMmol", "equivalents", "density", "densityUnit", "stockConcentration", "stockConcentrationUnit", "inputValue", "inputUnit", "purityPercent"] as const) add(`reagent:${existing.id}:${field}`, existing[field], incoming[field]);
  }
  return found;
}
export function mergeDraft(current: ExperimentRecord, draft: ExperimentRecord, resolutions: Record<string, Resolution>): ExperimentRecord {
  const conflicts = findConflicts(current, draft); const isAiResolution = (field: Conflict["field"]) => resolutions[field] === "ai";
  const now = new Date().toISOString();
  const chosen = <T,>(field: Conflict["field"], currentValue: T, draftValue: T) => isAiResolution(field) || !value(currentValue) ? draftValue : currentValue;
  const unresolved = conflicts.filter(c => !resolutions[c.field]).map(c => `${c.field}: ${c.reason}`);
  const mergeReagent = (incoming: ExperimentRecord["reagents"][number]) => {
    const existing = current.reagents.find(row => row.name?.trim().toLowerCase() === incoming.name?.trim().toLowerCase());
    if (!existing) return incoming;
    const merged = { ...incoming, ...existing, fieldEvidence: { ...incoming.fieldEvidence, ...existing.fieldEvidence } };
    for (const field of ["molecularWeight", "mass", "massUnit", "volume", "volumeUnit", "amountMmol", "equivalents", "density", "densityUnit", "stockConcentration", "stockConcentrationUnit", "inputValue", "inputUnit", "purityPercent"] as const) {
      if (isAiResolution(`reagent:${existing.id}:${field}`) || !value(existing[field])) {
        Object.assign(merged, { [field]: incoming[field] });
        if (incoming.fieldEvidence?.[field]) merged.fieldEvidence[field] = incoming.fieldEvidence[field];
      }
    }
    return merged;
  };
  const reagents = draft.reagents.map(mergeReagent);
  reagents.push(...current.reagents.filter(existing => !draft.reagents.some(incoming => incoming.name?.trim().toLowerCase() === existing.name?.trim().toLowerCase())));
  const retainedConditions = { ...draft.conditions };
  for (const [field, previous] of Object.entries(current.conditions)) {
    const amount = ({ solventVolumeUnit: "solventVolume", vesselCapacityUnit: "vesselCapacity" } as Record<string, "solventVolume" | "vesselCapacity">)[field];
    if (amount && (!value(current.conditions[amount]) || isAiResolution(amount))) continue;
    if (!["provenance", "fieldEvidence"].includes(field) && value(previous) && !isAiResolution(field)) Object.assign(retainedConditions, { [field]: previous });
  }
  const conditionEvidence = { ...draft.conditions.fieldEvidence };
  for (const field of Object.keys(current.conditions.fieldEvidence ?? {})) if (!isAiResolution(field) && value(current.conditions[field as keyof typeof current.conditions])) conditionEvidence[field] = current.conditions.fieldEvidence![field];
  const evidence = { ...draft.fieldEvidence };
  for (const field of Object.keys(current.fieldEvidence ?? {})) if (!isAiResolution(field) && value(current[field as keyof ExperimentRecord])) evidence[field] = current.fieldEvidence![field];
  return {
    ...draft, reagents, fieldEvidence: evidence, experimentId: current.experimentId, createdAt: current.createdAt, updatedAt: now,
    title: chosen("title", current.title, draft.title), objective: chosen("objective", current.objective, draft.objective), reactionType: chosen("reactionType", current.reactionType, draft.reactionType),
    notes: chosen("notes", current.notes, draft.notes), expectedProduct: chosen("expectedProduct", current.expectedProduct, draft.expectedProduct), expectedMolecularWeight: chosen("expectedMolecularWeight", current.expectedMolecularWeight, draft.expectedMolecularWeight), productStoichiometry: chosen("productStoichiometry", current.productStoichiometry, draft.productStoichiometry), analyticalMethods: chosen("analyticalMethods", current.analyticalMethods, draft.analyticalMethods), safetyNotes: chosen("safetyNotes", current.safetyNotes, draft.safetyNotes),
    workup: chosen("workup", current.workup, draft.workup), purification: chosen("purification", current.purification, draft.purification),
    conditions: { ...retainedConditions, fieldEvidence: conditionEvidence,
      temperature: chosen("temperature", current.conditions.temperature, draft.conditions.temperature),
      temperatureUnit: isAiResolution("temperature") || !value(current.conditions.temperature) ? draft.conditions.temperatureUnit : current.conditions.temperatureUnit,
      duration: chosen("duration", current.conditions.duration, draft.conditions.duration),
      durationUnit: isAiResolution("duration") || !value(current.conditions.duration) ? draft.conditions.durationUnit : current.conditions.durationUnit,
      atmosphere: chosen("atmosphere", current.conditions.atmosphere, draft.conditions.atmosphere),
      vessel: chosen("vessel", current.conditions.vessel, draft.conditions.vessel),
      mixingMethod: chosen("mixingMethod", current.conditions.mixingMethod, draft.conditions.mixingMethod),
      targetConcentrationUnit: isAiResolution("targetConcentration") || !value(current.conditions.targetConcentration) ? draft.conditions.targetConcentrationUnit : current.conditions.targetConcentrationUnit,
      solvent: chosen("solvent", current.conditions.solvent, draft.conditions.solvent), targetConcentration: chosen("targetConcentration", current.conditions.targetConcentration, draft.conditions.targetConcentration) },
    originalInstruction: draft.originalInstruction || current.originalInstruction,
    conflicts: unresolved, assumptions: draft.assumptions.map(a => a.startsWith("UNCONFIRMED:") ? a : `UNCONFIRMED: ${a}`),
    warnings: [...new Set([...current.warnings, ...draft.warnings])],
  };
}
const toMmol = (r: ExperimentRecord["reagents"][number]) => r.amountMmol ?? (r.mass !== null && r.mass !== undefined && r.molecularWeight ? (r.massUnit === "g" ? r.mass * 1000 : r.mass) / r.molecularWeight : null);
const ml = (value: number, unit: "uL" | "mL" | "L") => unit === "uL" ? value / 1000 : unit === "L" ? value * 1000 : value;
export type Calculation = { reagentId?: string; label: string; formula: string; substituted: string; result: string };
export function calculations(record: ExperimentRecord): Calculation[] {
  const limiting = record.reagents.find(r => r.isLimitingReagent); const limitMmol = limiting ? toMmol(limiting) : null; const result: Calculation[] = [];
  for (const r of record.reagents) {
    const mmol = toMmol(r); if (mmol !== null && r.mass !== null && r.molecularWeight) result.push({ reagentId: r.id, label: `${r.name || "Reagent"}: amount`, formula: "mmol = mass (mg) / MW (g/mol)", substituted: `${r.massUnit === "g" ? r.mass * 1000 : r.mass} mg / ${r.molecularWeight} g/mol`, result: `${mmol.toPrecision(5)} mmol` });
    if (limitMmol && r.equivalents && !r.isLimitingReagent) { const planned = limitMmol * r.equivalents; result.push({ reagentId: r.id, label: `${r.name || "Reagent"}: equivalents`, formula: "reagent mmol = limiting mmol x equivalents", substituted: `${limitMmol.toPrecision(5)} mmol x ${r.equivalents}`, result: `${planned.toPrecision(5)} mmol` }); if (r.molecularWeight) result.push({ reagentId: r.id, label: `${r.name || "Reagent"}: mass`, formula: "mass (mg) = mmol x MW (g/mol)", substituted: `${planned.toPrecision(5)} mmol x ${r.molecularWeight} g/mol`, result: `${(planned * r.molecularWeight).toPrecision(5)} mg` }); if (r.stockConcentration) result.push({ reagentId: r.id, label: `${r.name || "Reagent"}: stock volume`, formula: "volume (uL) = mmol / stock concentration (M) x 1000", substituted: `${planned.toPrecision(5)} / ${r.stockConcentration} x 1000`, result: `${(planned / r.stockConcentration * 1000).toPrecision(5)} uL` }); }
    if (r.physicalState === "liquid" && r.mass && r.density) result.push({ reagentId: r.id, label: `${r.name || "Liquid"}: volume`, formula: "volume (uL) = mass (mg) / density (g/mL)", substituted: `${r.massUnit === "g" ? r.mass * 1000 : r.mass} mg / ${r.density} g/mL`, result: `${((r.massUnit === "g" ? r.mass * 1000 : r.mass) / r.density).toPrecision(5)} uL` });
  }
  if (limitMmol && record.conditions.targetConcentration) { const m = record.conditions.targetConcentration * (record.conditions.targetConcentrationUnit === "mM" ? 0.001 : record.conditions.targetConcentrationUnit === "uM" ? 0.000001 : 1); result.push({ label: "Total reaction volume", formula: "volume (mL) = limiting mmol / target concentration (M)", substituted: `${limitMmol.toPrecision(5)} mmol / ${m} M`, result: `${(limitMmol / m).toPrecision(5)} mL` }); }
  return result;
}
export function blockingReasons(record: ExperimentRecord) {
  const reasons: string[] = [...calculateExperiment(record).errors];
  if (record.conflicts.length) reasons.push("Resolve all material AI conflicts."); if (record.assumptions.some(a => a.startsWith("UNCONFIRMED:"))) reasons.push("Confirm or reject all required AI assumptions.");
  const cap = record.conditions.vesselCapacity; if (cap && record.conditions.vesselCapacityUnit) { const needed = calculations(record).find(c => c.label === "Total reaction volume"); if (needed) { const volume = Number(needed.result.split(" ")[0]); if (Number.isFinite(volume) && volume > ml(cap, record.conditions.vesselCapacityUnit)) reasons.push("Calculated reaction volume exceeds the stated vessel capacity."); } }
  return [...new Set(reasons)];
}
