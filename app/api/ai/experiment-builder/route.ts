import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateExperimentDraftJson } from "@/lib/ai/gemini";
import { AiServiceError } from "@/lib/ai/service-error";
import { experimentExtractionSchema, experimentSchema } from "@/lib/ai/experiment-schema";

const requestSchema = z.object({ instruction: z.string().trim().min(10).max(12_000) });
const importedProvenance = () => ({ sourceType: "imported_from_text" as const, sourceText: null, sourceReference: null, confidence: null, confirmedByUser: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
function errorResponse(error: AiServiceError, requestId: string) { console.error("BindLab AI request failed", { requestId, code: error.code, status: error.status }); return NextResponse.json({ ok: false, error: { code: error.code, message: error.message, requestId } }, { status: error.status }); }
function extractJson(text: string) { const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, ""); try { return JSON.parse(cleaned) as Record<string, unknown>; } catch { throw new AiServiceError("JSON_PARSE_ERROR", 502, "The AI returned invalid JSON. No experiment was saved."); } }
function emptyExtraction() { return { title: null, objective: null, reactionType: null, experimentStatus: "needs_review" as const, reagents: [], conditions: { solvent: null, solventVolume: null, solventVolumeUnit: "mL" as const, targetConcentration: null, targetConcentrationUnit: "M" as const, temperature: null, temperatureUnit: "C" as const, duration: null, durationUnit: "h" as const, atmosphere: null, vessel: null, vesselCapacity: null, vesselCapacityUnit: "mL" as const, mixingMethod: null, orderOfAddition: [], provenance: importedProvenance() }, workup: null, purification: null, analyticalMethods: [], expectedProduct: null, expectedMolecularWeight: null, notes: null, safetyNotes: [], missingInformation: [], conflicts: [], assumptions: [], warnings: [], aiSummary: null }; }
function normalizeReagent(reagent: Record<string, unknown>) { const { provenance: rawProvenance, ...fields } = reagent; return { id: randomUUID(), name: null, role: null, physicalState: "unknown" as const, molecularWeight: null, molecularWeightUnit: "g/mol" as const, mass: null, massUnit: null, amountMmol: null, equivalents: null, density: null, densityUnit: "g/mL" as const, stockConcentration: null, stockConcentrationUnit: "M" as const, volume: null, volumeUnit: null, isLimitingReagent: false, ...fields, provenance: { ...importedProvenance(), ...(rawProvenance as Record<string, unknown> | undefined) } }; }
function workflowDefaults(instruction: string, raw: Record<string, unknown>) {
  const western = /western\s*blot/i.test(instruction);
  if (!western) return raw;
  const missing = Array.isArray(raw.missingInformation) ? raw.missingInformation.filter((item): item is string => typeof item === "string") : [];
  const required = ["Sample identity and protein target", "Primary and secondary antibody details and dilutions", "Gel percentage and sample loading amount", "Transfer, blocking, and imaging conditions"];
  return { ...raw, title: raw.title || "Western blot", reactionType: raw.reactionType || "Western blot", missingInformation: [...new Set([...missing, ...required])], warnings: [...new Set([...(Array.isArray(raw.warnings) ? raw.warnings.filter((item): item is string => typeof item === "string") : []), "Requires researcher confirmation before use."])] };
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const { instruction } = requestSchema.parse(await request.json());
    const prompt = `Extract only facts explicitly stated in this experiment text. Return JSON only, with this object shape: {"title": string|null, "objective": string|null, "reactionType": string|null, "reagents": [], "conditions": {}, "analyticalMethods": [], "notes": string|null, "missingInformation": string[], "assumptions": string[], "warnings": string[]}. Never guess chemistry values, safety details, instruments, or conditions; list truly needed unknown scientific facts in missingInformation. The request may be an incomplete analytical, biological, sample-preparation, or chemical workflow. Text: ${instruction}`;
    const generation = await generateExperimentDraftJson(prompt); const raw = workflowDefaults(instruction, extractJson(generation.text)); const base = emptyExtraction();
    let extracted;
    try { extracted = experimentExtractionSchema.parse({ ...base, ...raw, reagents: Array.isArray(raw.reagents) ? raw.reagents.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map(normalizeReagent) : [], conditions: { ...base.conditions, ...(raw.conditions as Record<string, unknown> | undefined) } }); }
    catch { throw new AiServiceError("SCHEMA_VALIDATION_ERROR", 422, "The AI returned an invalid experiment draft. No experiment was saved."); }
    const now = new Date().toISOString(); const draft = experimentSchema.parse({ ...extracted, experimentId: randomUUID(), createdAt: now, updatedAt: now, originalInstruction: instruction, experimentStatus: "needs_review" });
    return NextResponse.json({ ok: true, draft, requestId, metadata: generation.metadata });
  } catch (error) {
    if (error instanceof AiServiceError) return errorResponse(error, requestId);
    if (error instanceof z.ZodError) return errorResponse(new AiServiceError("INVALID_AI_OUTPUT", 400, "Enter an experiment description between 10 and 12,000 characters."), requestId);
    return errorResponse(new AiServiceError("UNKNOWN_ERROR", 500, "The AI request failed. Use the request ID to inspect the server log."), requestId);
  }
}
