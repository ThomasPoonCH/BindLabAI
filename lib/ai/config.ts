import "server-only";
import { AiServiceError } from "./service-error";

const placeholder = /^(your_|replace|changeme|example|placeholder|<)/i;
const clean = (value: string | undefined) => value?.trim() ?? "";

export type AiConfig = { provider: "gemini"; model: string; fallbackModel: string; apiKey: string };

export function getAiConfig(): AiConfig {
  const provider = clean(process.env.AI_PROVIDER || "gemini").toLowerCase();
  if (provider !== "gemini") throw new AiServiceError("CONFIGURATION_ERROR", 500, "BindLab AI server configuration is invalid.");
  const apiKey = clean(process.env.GEMINI_API_KEY);
  if (!apiKey || placeholder.test(apiKey)) throw new AiServiceError("CONFIGURATION_ERROR", 500, "BindLab AI is not fully configured on the server. Check GEMINI_API_KEY.");
  const model = clean(process.env.GEMINI_MODEL) || "gemma-4-31b-it";
  const fallbackModel = clean(process.env.GEMINI_FALLBACK_MODEL) || "gemini-flash-latest";
  return { provider: "gemini", model, fallbackModel, apiKey };
}
