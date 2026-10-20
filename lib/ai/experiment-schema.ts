import { z } from "zod";

export const provenanceSchema = z.object({
  sourceType: z.enum(["user_entered", "imported_from_text", "imported_from_document", "retrieved_from_database", "calculated_by_bindlab", "suggested_by_ai", "experimentally_confirmed"]),
  sourceText: z.string().nullable().default(null), sourceReference: z.string().nullable().default(null),
  confidence: z.number().finite().min(0).max(1).nullable().default(null), confirmedByUser: z.boolean().default(false),
  createdAt: z.string().default(() => new Date().toISOString()), updatedAt: z.string().default(() => new Date().toISOString()),
});

export const fieldEvidenceSchema = z.object({
  status: z.enum(["source_extracted", "calculated", "ai_suggested", "researcher_confirmed", "unverified"]),
  sourceReference: z.string().nullable().default(null), sourceExcerpt: z.string().nullable().default(null), updatedAt: z.string(),
});
export type FieldEvidence = z.infer<typeof fieldEvidenceSchema>;
const evidenceMap = z.record(fieldEvidenceSchema).optional();

export const reagentSchema = z.object({
  fieldEvidence: evidenceMap,
  id: z.string(), name: z.string().nullable(), role: z.string().nullable(),
  physicalState: z.enum(["solid", "liquid", "stock_solution", "gas", "unknown"]).nullable(),
  molecularWeight: z.number().finite().positive().nullable(), molecularWeightUnit: z.literal("g/mol").default("g/mol"),
  mass: z.number().finite().nonnegative().nullable(), massUnit: z.enum(["mg", "g"]).nullable(),
  amountMmol: z.number().finite().nonnegative().nullable(), equivalents: z.number().finite().nonnegative().nullable(),
  density: z.number().finite().positive().nullable(), densityUnit: z.enum(["g/mL", "mg/mL"]).default("g/mL"),
  stockConcentration: z.number().finite().positive().nullable(), stockConcentrationUnit: z.enum(["uM", "mM", "M"]).default("M"),
  volume: z.number().finite().nonnegative().nullable(), volumeUnit: z.enum(["uL", "mL", "L"]).nullable(),
  isLimitingReagent: z.boolean().default(false), provenance: provenanceSchema,
  canonicalReagentId: z.string().nullable().optional(), canonicalName: z.string().nullable().optional(),
  propertySource: z.string().nullable().optional(), propertyVerifiedAt: z.string().nullable().optional(),
  propertyVerificationStatus: z.enum(["bindlab_verified", "user_confirmed", "external_verified", "ai_suggested", "unresolved"]).optional(),
  inputValue: z.number().finite().nonnegative().nullable().optional(),
  inputUnit: z.enum(["ug", "mg", "g", "nmol", "umol", "mmol", "mol", "uL", "mL", "L"]).nullable().optional(),
  purityPercent: z.number().finite().positive().max(100).nullable().optional(),
});

export const conditionsSchema = z.object({
  fieldEvidence: evidenceMap,
  solvent: z.string().nullable(), solventVolume: z.number().finite().positive().nullable(), solventVolumeUnit: z.enum(["uL", "mL", "L"]).default("mL"),
  targetConcentration: z.number().finite().positive().nullable(), targetConcentrationUnit: z.enum(["M", "mM", "uM"]).default("M"),
  concentrationBasisReagentId: z.string().nullable().optional(),
  temperature: z.string().nullable(), temperatureUnit: z.enum(["C", "K"]).default("C"),
  duration: z.string().nullable(), durationUnit: z.enum(["min", "h", "d"]).default("h"),
  atmosphere: z.string().nullable(), vessel: z.string().nullable(), vesselCapacity: z.number().finite().positive().nullable(), vesselCapacityUnit: z.enum(["uL", "mL", "L"]).default("mL"),
  mixingMethod: z.string().nullable(), orderOfAddition: z.array(z.string()), provenance: provenanceSchema,
});

export const experimentSchema = z.object({
  fieldEvidence: evidenceMap,
  storageRevision: z.string().optional(),
  experimentId: z.string(), title: z.string().nullable(), objective: z.string().nullable(), reactionType: z.string().nullable(),
  experimentStatus: z.enum(["draft", "needs_review", "ready_to_run"]).default("needs_review"), createdAt: z.string(), updatedAt: z.string(), originalInstruction: z.string(),
  reagents: z.array(reagentSchema), conditions: conditionsSchema, workup: z.string().nullable(), purification: z.string().nullable(),
  analyticalMethods: z.array(z.string()), expectedProduct: z.string().nullable(), expectedMolecularWeight: z.number().finite().positive().nullable(), notes: z.string().nullable(), safetyNotes: z.array(z.string()),
  missingInformation: z.array(z.string()), conflicts: z.array(z.string()), assumptions: z.array(z.string()), warnings: z.array(z.string()), aiSummary: z.string().nullable(),
  productStoichiometry: z.number().finite().positive().nullable().optional(), expectedLcmsIons: z.array(z.string()).optional(), actualIsolatedMassMg: z.number().finite().nonnegative().nullable().optional(), actualYieldPercent: z.number().finite().min(0).max(100).nullable().optional(),
});
export type ExperimentRecord = z.infer<typeof experimentSchema>;
export const experimentExtractionSchema = experimentSchema.omit({ experimentId: true, createdAt: true, updatedAt: true, originalInstruction: true });
