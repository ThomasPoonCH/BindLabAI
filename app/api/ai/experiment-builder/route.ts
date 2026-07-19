import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateExperimentDraftJson } from "@/lib/ai/gemini";
import { AiServiceError } from "@/lib/ai/service-error";
import { experimentExtractionSchema, experimentSchema } from "@/lib/ai/experiment-schema";
import { compactExtractionSchema } from "@/lib/ai/compact-extraction-schema";
import { matchReagent } from "@/lib/ai/reagent-matcher";
import { buildDeterministicTextDraft } from "@/lib/ai/partial-draft";

const requestSchema = z.object({ instruction: z.string().trim().min(1).max(72_000), pdfData: z.string().optional() });
const importedProvenance = () => ({ sourceType: "imported_from_text" as const, sourceText: null, sourceReference: null, confidence: null, confirmedByUser: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
function errorResponse(error: AiServiceError, requestId: string) { console.error("BindLab AI request failed", { requestId, code: error.code, status: error.status }); return NextResponse.json({ ok: false, error: { code: error.code, message: error.message, requestId } }, { status: error.status }); }
function extractJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  const candidates = [cleaned];
  const firstObject = cleaned.indexOf("{");
  const lastObject = cleaned.lastIndexOf("}");
  if (firstObject >= 0 && lastObject > firstObject) candidates.push(cleaned.slice(firstObject, lastObject + 1));
  for (const candidate of candidates) {
    try { return JSON.parse(candidate) as Record<string, unknown>; } catch { /* Try the next safe candidate. */ }
  }
  throw new AiServiceError("JSON_PARSE_ERROR", 502, "The AI returned invalid JSON. No experiment was saved.");
}
function emptyExtraction() { return { title: null, objective: null, reactionType: null, experimentStatus: "needs_review" as const, reagents: [], conditions: { solvent: null, solventVolume: null, solventVolumeUnit: "mL" as const, targetConcentration: null, targetConcentrationUnit: "M" as const, concentrationBasisReagentId: null, temperature: null, temperatureUnit: "C" as const, duration: null, durationUnit: "h" as const, atmosphere: null, vessel: null, vesselCapacity: null, vesselCapacityUnit: "mL" as const, mixingMethod: null, orderOfAddition: [], provenance: importedProvenance() }, workup: null, purification: null, analyticalMethods: [], expectedProduct: null, expectedMolecularWeight: null, notes: null, safetyNotes: [], missingInformation: [], conflicts: [], assumptions: [], warnings: [], aiSummary: null }; }
const numberOrNull = (value: unknown) => { if (value === null || value === undefined || value === "") return null; const parsed = typeof value === "number" ? value : Number(value); return Number.isFinite(parsed) ? parsed : null; };
const textOrNull = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const stringList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean) : [];
function normalizeProvenance(value: unknown) { const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}; const allowed = ["user_entered", "imported_from_text", "imported_from_document", "retrieved_from_database", "calculated_by_bindlab", "suggested_by_ai", "experimentally_confirmed"] as const; const sourceType = allowed.includes(raw.sourceType as typeof allowed[number]) ? raw.sourceType as typeof allowed[number] : "imported_from_document"; return { ...importedProvenance(), ...raw, sourceType, sourceText: textOrNull(raw.sourceText), sourceReference: textOrNull(raw.sourceReference), confidence: numberOrNull(raw.confidence), confirmedByUser: raw.confirmedByUser === true }; }
function normalizeReagent(reagent: Record<string, unknown>) {
  const raw = reagent.amount && typeof reagent.amount === "object" ? reagent.amount as Record<string, unknown> : {};
  const fields = { ...reagent, ...raw };
  const physicalAliases: Record<string, "solid" | "liquid" | "stock_solution" | "gas" | "unknown"> = { solid: "solid", powder: "solid", liquid: "liquid", solution: "stock_solution", stock: "stock_solution", stock_solution: "stock_solution", gas: "gas" };
  const state = typeof fields.physicalState === "string" ? physicalAliases[fields.physicalState.toLowerCase()] ?? "unknown" : "unknown";
  return { id: typeof fields.id === "string" ? fields.id : randomUUID(), name: textOrNull(fields.name), role: textOrNull(fields.role), physicalState: state, molecularWeight: numberOrNull(fields.molecularWeight ?? fields.mw), molecularWeightUnit: "g/mol" as const, mass: numberOrNull(fields.mass), massUnit: fields.massUnit === "g" ? "g" as const : fields.massUnit === "mg" ? "mg" as const : null, amountMmol: numberOrNull(fields.amountMmol ?? fields.mmol), equivalents: numberOrNull(fields.equivalents ?? fields.eq), density: numberOrNull(fields.density), densityUnit: "g/mL" as const, stockConcentration: numberOrNull(fields.stockConcentration), stockConcentrationUnit: "M" as const, volume: numberOrNull(fields.volume), volumeUnit: ["uL", "mL", "L"].includes(String(fields.volumeUnit)) ? fields.volumeUnit as "uL" | "mL" | "L" : null, isLimitingReagent: fields.isLimitingReagent === true, provenance: normalizeProvenance(fields.provenance) };
}
function normalizeConditions(value: unknown) { const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}; return { solvent: textOrNull(raw.solvent), solventVolume: numberOrNull(raw.solventVolume), solventVolumeUnit: ["uL", "mL", "L"].includes(String(raw.solventVolumeUnit)) ? raw.solventVolumeUnit as "uL" | "mL" | "L" : "mL" as const, targetConcentration: numberOrNull(raw.targetConcentration), targetConcentrationUnit: ["M", "mM", "uM"].includes(String(raw.targetConcentrationUnit)) ? raw.targetConcentrationUnit as "M" | "mM" | "uM" : "M" as const, concentrationBasisReagentId: textOrNull(raw.concentrationBasisReagentId), temperature: textOrNull(raw.temperature), temperatureUnit: raw.temperatureUnit === "K" ? "K" as const : "C" as const, duration: textOrNull(raw.duration), durationUnit: ["min", "h", "d"].includes(String(raw.durationUnit)) ? raw.durationUnit as "min" | "h" | "d" : "h" as const, atmosphere: textOrNull(raw.atmosphere), vessel: textOrNull(raw.vessel), vesselCapacity: numberOrNull(raw.vesselCapacity), vesselCapacityUnit: ["uL", "mL", "L"].includes(String(raw.vesselCapacityUnit)) ? raw.vesselCapacityUnit as "uL" | "mL" | "L" : "mL" as const, mixingMethod: textOrNull(raw.mixingMethod), orderOfAddition: stringList(raw.orderOfAddition), provenance: normalizeProvenance(raw.provenance) }; }
function normalizeExtraction(rawInput: Record<string, unknown>) {
  const wrapper = rawInput.draft ?? rawInput.experiment ?? rawInput.result ?? rawInput.data;
  const raw = wrapper && typeof wrapper === "object" ? wrapper as Record<string, unknown> : rawInput;
  return { title: textOrNull(raw.title), objective: textOrNull(raw.objective), reactionType: textOrNull(raw.reactionType), experimentStatus: "needs_review" as const, reagents: Array.isArray(raw.reagents) ? raw.reagents.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map(normalizeReagent) : [], conditions: normalizeConditions(raw.conditions), workup: textOrNull(raw.workup ?? raw.workUp), purification: textOrNull(raw.purification), analyticalMethods: stringList(raw.analyticalMethods ?? raw.analysis), expectedProduct: textOrNull(raw.expectedProduct), expectedMolecularWeight: numberOrNull(raw.expectedMolecularWeight), notes: textOrNull(raw.notes), safetyNotes: stringList(raw.safetyNotes), missingInformation: stringList(raw.missingInformation), conflicts: stringList(raw.conflicts), assumptions: stringList(raw.assumptions), warnings: stringList(raw.warnings), aiSummary: textOrNull(raw.aiSummary ?? raw.summary) };
}
function compactToRecord(raw: Record<string, unknown>) {
  if (!Array.isArray(raw.reagents) || !raw.reagents.some(item => item && typeof item === "object" && "nameAsWritten" in item)) return raw;
  const compact = compactExtractionSchema.parse(raw);
  const visualWarnings = compact.visualFindings.filter(item => item.requiresManualConfirmation).map(item => `Page ${item.pageNumber ?? "unknown"}: ${item.description} requires manual confirmation.`);
  const matches = compact.reagents.map(item => item.nameAsWritten ? matchReagent(item.nameAsWritten) : null).filter(Boolean);
  const matchWarnings = matches.filter(item => item?.requiresConfirmation).map(item => `Reagent match requires confirmation: ${item?.extractedName}.`);
  const quantity = (written: string | null) => { const value = written?.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(mg|g|mmol|mL|uL|µL|equiv|eq)\b/i); if (!value) return {}; const n = Number(value[1]); const unit = value[2].toLowerCase(); return unit === "mg" || unit === "g" ? { mass: n, massUnit: unit as "mg" | "g" } : unit === "mmol" ? { amountMmol: n } : unit === "equiv" || unit === "eq" ? { equivalents: n } : { volume: n, volumeUnit: unit === "ml" ? "mL" as const : "uL" as const }; };
  return { title: compact.documentTitle, objective: compact.objective, reagents: compact.reagents.map(item => { const match = item.nameAsWritten ? matchReagent(item.nameAsWritten) : null; return { name: item.nameAsWritten, role: item.roleAsWritten, ...quantity(item.quantityAsWritten), provenance: { sourceType: item.sourceType === "pdf_image" ? "imported_from_document" : "imported_from_text", sourceReference: item.pageNumber ? `PDF page ${item.pageNumber}` : null }, notes: [item.quantityAsWritten ? `As written: ${item.quantityAsWritten}` : null, match?.canonicalName ? `Suggested canonical match: ${match.canonicalName}` : null].filter(Boolean).join("; ") || null }; }), conditions: { solvent: compact.conditions.solventAsWritten, temperature: compact.conditions.temperatureAsWritten, duration: compact.conditions.timeAsWritten, atmosphere: compact.conditions.atmosphereAsWritten }, workup: compact.workupSteps.join("\n") || null, purification: compact.purificationSteps.join("\n") || null, analyticalMethods: compact.analysisSteps, notes: compact.procedureSteps.join("\n") || null, missingInformation: compact.missingInformation, warnings: [...compact.warnings, ...visualWarnings, ...matchWarnings] };
}
function workflowDefaults(instruction: string, raw: Record<string, unknown>) {
  const western = /western\s*blot/i.test(instruction);
  if (!western) return raw;
  const missing = Array.isArray(raw.missingInformation) ? raw.missingInformation.filter((item): item is string => typeof item === "string") : [];
  const required = ["Sample identity and protein target", "Primary and secondary antibody details and dilutions", "Gel percentage and sample loading amount", "Transfer, blocking, and imaging conditions"];
  return { ...raw, title: raw.title || "Western blot", reactionType: raw.reactionType || "Western blot", missingInformation: [...new Set([...missing, ...required])], warnings: [...new Set([...(Array.isArray(raw.warnings) ? raw.warnings.filter((item): item is string => typeof item === "string") : []), "Requires researcher confirmation before use."])] };
}
function buildDraft(responseText: string, instruction: string, additionalWarnings: string[] = []) {
  const raw = workflowDefaults(instruction, compactToRecord(extractJson(responseText))); const base = emptyExtraction();
  const normalized = normalizeExtraction(raw);
  const parsed = experimentExtractionSchema.safeParse({ ...base, ...normalized, warnings: [...normalized.warnings, ...additionalWarnings] });
  if (!parsed.success) throw new AiServiceError("SCHEMA_VALIDATION_ERROR", 422, "The extracted document could not be mapped into a valid experiment draft.");
  const now = new Date().toISOString();
  return experimentSchema.parse({ ...parsed.data, experimentId: randomUUID(), createdAt: now, updatedAt: now, originalInstruction: instruction, experimentStatus: "needs_review" });
}
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const { instruction, pdfData } = requestSchema.parse(await request.json());
    const prompt = `Inspect the attached PDF and selectable text. Return exactly one compact JSON object and nothing else. Combine text and visual evidence from reaction schemes, structures, arrows, reagent tables, figures, and handwritten notes. Shape: {"documentTitle":null,"objective":null,"reagents":[{"nameAsWritten":null,"quantityAsWritten":null,"roleAsWritten":null,"pageNumber":null,"sourceType":"pdf_text"}],"conditions":{"solventAsWritten":null,"temperatureAsWritten":null,"timeAsWritten":null,"atmosphereAsWritten":null},"procedureSteps":[],"workupSteps":[],"purificationSteps":[],"analysisSteps":[],"visualFindings":[{"pageNumber":null,"type":"reaction_scheme","description":"","confidence":0,"requiresManualConfirmation":true}],"missingInformation":[],"warnings":[]}. Never guess structures, SMILES, molecular weights, density, concentration, equivalents, temperature, time, yield, safety, or instrument settings. Unclear visual content must be described and flagged for manual confirmation with a page number. Text evidence and user instruction: ${instruction}`;
    try {
      const generation = await generateExperimentDraftJson(prompt, pdfData);
      return NextResponse.json({ ok: true, draft: buildDraft(generation.text, instruction), requestId, metadata: generation.metadata });
    } catch (visualError) {
      const classified = visualError instanceof AiServiceError ? visualError : new AiServiceError("UNKNOWN_ERROR", 502, "The AI provider returned an unusable response.");
      const canReturnValidatedFallback = !["CONFIGURATION_ERROR", "AUTHENTICATION_FAILED"].includes(classified.code);
      if (!canReturnValidatedFallback) throw classified;
      if (!pdfData) {
        const partialDraft = buildDeterministicTextDraft(instruction);
        return NextResponse.json({
          ok: false,
          code: "AI_EXTRACTION_FALLBACK",
          message: "AI extraction did not complete. A validated text draft is ready for review.",
          requestId,
          retryable: true,
          error: {
            code: "AI_EXTRACTION_FALLBACK",
            message: "AI extraction did not complete. A validated text draft is ready for review.",
            requestId,
            retryable: true,
          },
          partialDraft,
          completedStages: ["text_evidence_extraction", "experiment_mapping", "schema_validation"],
          failedStage: "ai_extraction",
        }, { status: 206 });
      }
      console.warn("BindLab PDF visual analysis did not complete; using the validated text path.", {
        requestId,
        code: classified.code,
      });
      const textPrompt = `Use only the selectable PDF text below. Return exactly one compact JSON object with documentTitle, objective, reagents, conditions, procedureSteps, workupSteps, purificationSteps, analysisSteps, visualFindings, missingInformation and warnings. Preserve page references when stated. Never invent chemistry values. Text: ${instruction}`;
      try {
        const textGeneration = await generateExperimentDraftJson(textPrompt);
        const partialDraft = buildDraft(textGeneration.text, instruction, ["The written PDF content was extracted successfully, but visual content has not yet been verified."]);
        return NextResponse.json({ ok: false, code: "VISUAL_ANALYSIS_TIMEOUT", message: "Visual analysis did not complete.", requestId, retryable: true, error: { code: "VISUAL_ANALYSIS_TIMEOUT", message: "Visual analysis did not complete.", requestId, retryable: true }, partialDraft, completedStages: ["pdf_upload", "pdf_text_extraction", "text_evidence_extraction", "experiment_mapping", "schema_validation"], failedStage: "visual_analysis", metadata: textGeneration.metadata }, { status: 206 });
      } catch {
        const partialDraft = buildDeterministicTextDraft(instruction);
        return NextResponse.json({ ok: false, code: "VISUAL_ANALYSIS_TIMEOUT", message: "Visual analysis did not complete.", requestId, retryable: true, error: { code: "VISUAL_ANALYSIS_TIMEOUT", message: "Visual analysis did not complete.", requestId, retryable: true }, partialDraft, completedStages: ["pdf_upload", "pdf_text_extraction", "text_evidence_extraction", "experiment_mapping", "schema_validation"], failedStage: "visual_analysis" }, { status: 206 });
      }
    }
  } catch (error) {
    if (error instanceof AiServiceError) return errorResponse(error, requestId);
    if (error instanceof z.ZodError) return errorResponse(new AiServiceError("INVALID_AI_OUTPUT", 400, "Enter an experiment description between 10 and 12,000 characters."), requestId);
    console.error("BindLab AI request failed before classification", {
      requestId,
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return errorResponse(new AiServiceError("UNKNOWN_ERROR", 500, "The AI request failed. Use the request ID to inspect the server log."), requestId);
  }
}
