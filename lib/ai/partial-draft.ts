import { randomUUID } from "crypto";
import { experimentSchema, type ExperimentRecord } from "./experiment-schema";
import { findReagentsInText } from "./reagent-matcher";

const now = () => new Date().toISOString();

function provenance(sourceText: string, sourceReference: string | null) {
  const timestamp = now();
  return {
    sourceType: "imported_from_text" as const,
    sourceText,
    sourceReference,
    confidence: 0.75,
    confirmedByUser: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function pageReference(text: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const before = text.match(new RegExp(`(?:page|p\\.?)\\s*(\\d+)[\\s\\S]{0,180}${escaped}`, "i"));
  const after = text.match(new RegExp(`${escaped}[\\s\\S]{0,180}(?:page|p\\.?)\\s*(\\d+)`, "i"));
  return before?.[1] ?? after?.[1] ? `PDF page ${before?.[1] ?? after?.[1]}` : "PDF selectable text";
}

function quantityNearName(text: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\b[\\s(:=]*(\\d+(?:\\.\\d+)?)\\s*(mg|g|mmol|mL|uL|µL|equiv|eq)\\b`, "i"));
  if (!match) return {};
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === "mg" || unit === "g") return { mass: value, massUnit: unit as "mg" | "g" };
  if (unit === "mmol") return { amountMmol: value };
  if (unit === "equiv" || unit === "eq") return { equivalents: value };
  return { volume: value, volumeUnit: unit === "ml" ? "mL" as const : "uL" as const };
}

export function buildDeterministicTextDraft(instruction: string): ExperimentRecord {
  const timestamp = now();
  const reagents = findReagentsInText(instruction).map((name) => ({
    id: randomUUID(),
    name,
    role: name === "DIPEA" ? "base" : name === "DMF" ? "solvent" : "reagent",
    physicalState: "unknown" as const,
    molecularWeight: null,
    molecularWeightUnit: "g/mol" as const,
    ...quantityNearName(instruction, name),
    mass: null,
    massUnit: null,
    amountMmol: null,
    equivalents: null,
    density: null,
    densityUnit: "g/mL" as const,
    stockConcentration: null,
    stockConcentrationUnit: "M" as const,
    volume: null,
    volumeUnit: null,
    isLimitingReagent: false,
    provenance: provenance(name, pageReference(instruction, name)),
  }));

  // Reapply only explicitly parsed quantities after the null defaults.
  for (const reagent of reagents) Object.assign(reagent, quantityNearName(instruction, reagent.name));

  return experimentSchema.parse({
    experimentId: randomUUID(),
    title: instruction.match(/([^\n]{1,100}(?:reaction|synthesis|preparation)[^\n]{0,100})/i)?.[1]?.trim() ?? "PDF experiment draft",
    objective: null,
    reactionType: null,
    experimentStatus: "needs_review",
    createdAt: timestamp,
    updatedAt: timestamp,
    originalInstruction: instruction,
    reagents,
    conditions: {
      solvent: null,
      solventVolume: null,
      solventVolumeUnit: "mL",
      targetConcentration: null,
      targetConcentrationUnit: "M",
      temperature: null,
      temperatureUnit: "C",
      duration: null,
      durationUnit: "h",
      atmosphere: null,
      vessel: null,
      vesselCapacity: null,
      vesselCapacityUnit: "mL",
      mixingMethod: null,
      orderOfAddition: [],
      provenance: provenance("Selectable PDF text", "PDF selectable text"),
    },
    workup: null,
    purification: null,
    analyticalMethods: [],
    expectedProduct: null,
    expectedMolecularWeight: null,
    notes: null,
    safetyNotes: [],
    missingInformation: ["Confirm all image-derived structures, quantities, and conditions."],
    conflicts: [],
    assumptions: [],
    warnings: ["The written PDF content was extracted successfully, but visual content has not yet been verified."],
    aiSummary: null,
  });
}
