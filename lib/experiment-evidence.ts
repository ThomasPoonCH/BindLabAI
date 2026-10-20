import type { ExperimentRecord, FieldEvidence } from "./ai/experiment-schema";

export const reagentFields = ["name", "physicalState", "molecularWeight", "mass", "volume", "amountMmol", "equivalents", "density", "stockConcentration", "inputValue", "purityPercent"] as const;
export const conditionFields = ["solvent", "solventVolume", "targetConcentration", "temperature", "duration", "atmosphere", "vessel", "mixingMethod", "orderOfAddition"] as const;
export const recordFields = ["objective", "reactionType", "workup", "purification", "notes", "expectedProduct", "expectedMolecularWeight", "productStoichiometry", "analyticalMethods", "safetyNotes"] as const;
export const evidenceLabels = { source_extracted: "Source Extracted", calculated: "Calculated", ai_suggested: "AI Suggested", researcher_confirmed: "Researcher Confirmed", unverified: "Missing / Unverified" };
export const established = (value: unknown) => value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
export function fieldEvidence(value: unknown, evidence?: FieldEvidence): FieldEvidence {
  if (!established(value)) return { status: "unverified", sourceReference: null, sourceExcerpt: null, updatedAt: new Date().toISOString() };
  return evidence ?? { status: "unverified", sourceReference: null, sourceExcerpt: null, updatedAt: new Date().toISOString() };
}
export function confirmEvidence(previous?: FieldEvidence): FieldEvidence {
  return { ...previous, status: "researcher_confirmed", sourceReference: previous?.sourceReference ?? null, sourceExcerpt: previous?.sourceExcerpt ?? null, updatedAt: new Date().toISOString() };
}
export function recordEdits<T extends { fieldEvidence?: Record<string, FieldEvidence> }>(current: T, patch: Partial<T>): T {
  const evidence = { ...current.fieldEvidence };
  for (const [field, next] of Object.entries(patch)) {
    if (["fieldEvidence", "provenance", "updatedAt"].includes(field)) continue;
    const numericField = ({ massUnit: "mass", volumeUnit: "volume", inputUnit: "inputValue", stockConcentrationUnit: "stockConcentration", targetConcentrationUnit: "targetConcentration", temperatureUnit: "temperature", durationUnit: "duration", densityUnit: "density" } as Record<string, string>)[field];
    if (numericField && established(current[numericField as keyof T]) && JSON.stringify(next) !== JSON.stringify(current[field as keyof T])) evidence[numericField] = confirmEvidence(evidence[numericField]);
    if (JSON.stringify(next) !== JSON.stringify(current[field as keyof T])) evidence[field] = established(next) ? confirmEvidence(evidence[field]) : fieldEvidence(null);
  }
  return { ...current, ...patch, fieldEvidence: evidence };
}
// Never trust verification claims returned by a model or imported from a backup.
export function initializeUntrustedEvidence(record: ExperimentRecord): ExperimentRecord {
  const extracted = (value: unknown, sourceText?: string | null, reference?: string | null, suggestion = false): FieldEvidence => ({
    status: !established(value) ? "unverified" : suggestion ? "ai_suggested" : "source_extracted",
    sourceExcerpt: sourceText && record.originalInstruction.includes(sourceText) ? sourceText : null,
    sourceReference: reference ?? null,
    updatedAt: new Date().toISOString(),
  });
  return { ...record, experimentStatus: "needs_review",
    fieldEvidence: Object.fromEntries(recordFields.map(key => [key, extracted(record[key])])),
    reagents: record.reagents.map(row => ({ ...row, propertyVerificationStatus: "unresolved", canonicalReagentId: null, canonicalName: null, provenance: { ...row.provenance, confirmedByUser: false }, fieldEvidence: Object.fromEntries(reagentFields.map(key => [key, extracted(row[key], row.provenance.sourceText, row.provenance.sourceReference, row.provenance.sourceType === "suggested_by_ai")])) })),
    conditions: { ...record.conditions, provenance: { ...record.conditions.provenance, confirmedByUser: false }, fieldEvidence: Object.fromEntries(conditionFields.map(key => [key, extracted(record.conditions[key], record.conditions.provenance.sourceText, record.conditions.provenance.sourceReference, record.conditions.provenance.sourceType === "suggested_by_ai")])) },
  };
}
export function verificationIssues(record: ExperimentRecord): string[] {
  const issues: string[] = [];
  for (const row of record.reagents.filter(r => r.role !== "product")) {
    for (const key of reagentFields) if ((key === "name" || (row.isLimitingReagent && key === "inputValue") || (!row.isLimitingReagent && key === "equivalents") || established(row[key])) && fieldEvidence(row[key], row.fieldEvidence?.[key]).status !== "researcher_confirmed") issues.push(`${row.name || "Reagent"}: ${key} requires researcher confirmation.`);
  }
  for (const key of ["solvent", "temperature", "duration"] as const) if (fieldEvidence(record.conditions[key], record.conditions.fieldEvidence?.[key]).status !== "researcher_confirmed") issues.push(`${key}: Not specified or unverified — researcher confirmation required.`);
  if (!record.safetyNotes.length || record.fieldEvidence?.safetyNotes?.status !== "researcher_confirmed") issues.push("Safety review is not established; consult institutional SOPs.");
  return issues;
}
