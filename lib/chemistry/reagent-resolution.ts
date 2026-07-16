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
    molecularWeight: record.molecularWeight,
    density: record.density,
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
  return applyVerifiedRecord(reagent, resolution.record.id);
}

export function resolveExperimentReagents(record: ExperimentRecord): ExperimentRecord {
  return { ...record, reagents: record.reagents.map(resolveReagentProperties) };
}
