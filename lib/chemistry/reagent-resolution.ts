import type { ExperimentRecord } from "@/lib/ai/experiment-schema";
import { resolveVerifiedReagent, verifiedReagentLibrary } from "./verified-reagents";

type Reagent = ExperimentRecord["reagents"][number];

export function applyVerifiedRecord(reagent: Reagent, reagentId: string): Reagent {
  const record = verifiedReagentLibrary.find((item) => item.id === reagentId);
  if (!record) return reagent;
  return {
    ...reagent,
    canonicalReagentId: record.id,
    canonicalName: record.canonicalName,
    molecularWeight: record.molecularWeight ?? reagent.molecularWeight,
    density: record.density ?? reagent.density,
    densityUnit: record.density === null ? reagent.densityUnit : "g/mL",
    fieldEvidence: { ...reagent.fieldEvidence, molecularWeight: { status: "unverified", sourceReference: record.source, sourceExcerpt: null, updatedAt: new Date().toISOString() }, ...(record.density !== null ? { density: { status: "unverified" as const, sourceReference: record.source, sourceExcerpt: null, updatedAt: new Date().toISOString() } } : {}) },
    physicalState: record.physicalForm,
    propertySource: record.source,
    propertyVerifiedAt: record.lastVerifiedDate,
    propertyVerificationStatus: record.verificationStatus,
  };
}

export function resolveReagentProperties(reagent: Reagent): Reagent {
  if (["bindlab_verified", "external_verified", "user_confirmed"].includes(reagent.propertyVerificationStatus ?? "")) return reagent;
  if (!reagent.name?.trim()) return { ...reagent, canonicalReagentId: null, canonicalName: null, propertyVerificationStatus: "unresolved" };
  const resolution = resolveVerifiedReagent(reagent.name);
  if (!resolution.record || resolution.requiresConfirmation) return { ...reagent, canonicalReagentId: null, canonicalName: null, propertyVerificationStatus: resolution.matchType === "suggested" ? "ai_suggested" : "unresolved" };
  const sourceDensity = reagent.density === null ? null : reagent.density * (reagent.densityUnit === "mg/mL" ? 0.001 : 1);
  if ((reagent.molecularWeight !== null && resolution.record.molecularWeight !== null && Math.abs(reagent.molecularWeight - resolution.record.molecularWeight) > Math.max(0.001, resolution.record.molecularWeight * 1e-5)) || (sourceDensity !== null && resolution.record.density !== null && Math.abs(sourceDensity - resolution.record.density) > 0.001)) return { ...reagent, canonicalReagentId: resolution.record.id, canonicalName: resolution.record.canonicalName, propertyVerificationStatus: "unresolved", propertySource: "Source/database conflict: entered MW or density differs from the reagent library. Keep the source value or explicitly restore verified properties after checking identity and units." };
  return applyVerifiedRecord(reagent, resolution.record.id);
}

export function resolveExperimentReagents(record: ExperimentRecord): ExperimentRecord {
  return { ...record, reagents: record.reagents.map(resolveReagentProperties) };
}
