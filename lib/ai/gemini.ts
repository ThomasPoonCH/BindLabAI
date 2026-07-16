import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAiConfig } from "./config";
import { AiServiceError, classifyProviderError } from "./service-error";
import { verifiedModelOrder, clearModelHealthCache } from "./model-health";

export type GeminiJsonOptions = { prompt: string; modelName?: string; temperature?: number; pdfData?: string };
export type AiResponseMetadata = { requestedModel: string; successfulModel: string; fallbackUsed: boolean; attemptCount: number; preferredAttemptCount: number };
export type GeminiGeneration = { text: string; metadata: AiResponseMetadata };
type ModelRunner = (model: string) => Promise<string>;

export function getGeminiModelName(modelName = process.env.GEMINI_MODEL) { return modelName?.trim() || "gemma-4-31b-it"; }
// Verified against this project's generateContent endpoint. The older 2.5 alias
// is listed by metadata but returned 404 for generation with this API project.
export function getGeminiFallbackModelName(modelName = process.env.GEMINI_FALLBACK_MODEL) { return modelName?.trim() || "gemini-flash-latest"; }
export function isTemporaryProviderError(error: unknown) { const message = error instanceof Error ? error.message : String(error); return /\b(500|502|503|504)\b/.test(message) || /internal server error|service unavailable|bad gateway|gateway timeout/i.test(message); }
function isRateLimited(error: unknown) { const message = error instanceof Error ? error.message : String(error); return /\b429\b/.test(message) || /resource exhausted|rate limit|quota/i.test(message); }
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generationTimeout = <T,>(promise: Promise<T>, ms = 15_000) => Promise.race<T>([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("504 Gateway Timeout")), ms))]);

export async function runWithModelFallback(run: ModelRunner, requestedModel: string, fallbackModel: string, sleep = delay): Promise<GeminiGeneration> {
  let preferredAttempts = 0;
  for (let retry = 0; retry < 3; retry += 1) { preferredAttempts += 1; try { return { text: await run(requestedModel), metadata: { requestedModel, successfulModel: requestedModel, fallbackUsed: false, attemptCount: preferredAttempts, preferredAttemptCount: preferredAttempts } }; } catch (error) { if (!isTemporaryProviderError(error)) throw error; if (retry < 2) await sleep(1000 * (retry + 1)); } }
  return { text: await run(fallbackModel), metadata: { requestedModel, successfulModel: fallbackModel, fallbackUsed: true, attemptCount: preferredAttempts + 1, preferredAttemptCount: preferredAttempts } };
}

export async function generateGeminiJson({ prompt, modelName, temperature = 0.25 }: GeminiJsonOptions): Promise<GeminiGeneration> {
  const config = getAiConfig(); const genAI = new GoogleGenerativeAI(config.apiKey);
  const run: ModelRunner = async (selectedModel) => { const model = genAI.getGenerativeModel({ model: selectedModel, generationConfig: { temperature } }); const result = await generationTimeout(model.generateContent(prompt)); return result.response.text(); };
  try { return await runWithModelFallback(run, modelName?.trim() || config.model, config.fallbackModel); }
  catch (error) { if (error instanceof AiServiceError) throw error; throw classifyProviderError(error); }
}

export async function generateExperimentDraftJson(prompt: string, pdfData?: string): Promise<GeminiGeneration> {
  const config = getAiConfig();
  const verified = await verifiedModelOrder();
  const primaryModel = verified[0];
  const secondaryModel = verified[1];
  if (!primaryModel) throw new AiServiceError("CONFIGURATION_ERROR", 503, "No configured Gemini model is currently available for this project.");
  const genAI = new GoogleGenerativeAI(config.apiKey);
  const run = async (selectedModel: string) => {
    // Flash supports provider JSON mode; Gemma stays on plain text because its
    // structured-output support is not reliable for this project.
    const isGemma = selectedModel.toLowerCase().startsWith("gemma");
    const model = genAI.getGenerativeModel({ model: selectedModel, generationConfig: isGemma ? { temperature: 0, maxOutputTokens: 2048 } : { responseMimeType: "application/json", temperature: 0, maxOutputTokens: 2048 } });
    const contents = pdfData ? [{ text: prompt }, { inlineData: { mimeType: "application/pdf", data: pdfData } }] : prompt;
    const result = await generationTimeout(model.generateContent(contents), 20_000);
    return result.response.text();
  };
  try { return { text: await run(primaryModel), metadata: { requestedModel: primaryModel, successfulModel: primaryModel, fallbackUsed: false, attemptCount: 1, preferredAttemptCount: 1 } }; }
  catch (primaryError) {
    // Rate limits are not retried. We may still make one fresh request to the
    // configured secondary model, which keeps the Builder useful if Flash has
    // exhausted its own model-specific quota.
    if (!isTemporaryProviderError(primaryError) && !isRateLimited(primaryError)) throw classifyProviderError(primaryError);
    if (!secondaryModel) throw classifyProviderError(primaryError);
    if (/model not found/i.test(String(primaryError))) clearModelHealthCache();
    try { return { text: await run(secondaryModel), metadata: { requestedModel: primaryModel, successfulModel: secondaryModel, fallbackUsed: true, attemptCount: 2, preferredAttemptCount: 1 } }; }
    catch (secondaryError) { throw classifyProviderError(secondaryError); }
  }
}
