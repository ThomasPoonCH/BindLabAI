export type AiErrorCode = "CONFIGURATION_ERROR" | "AUTHENTICATION_FAILED" | "MODEL_NOT_FOUND" | "MODEL_ACCESS_DENIED" | "RATE_LIMITED" | "NETWORK_ERROR" | "TIMEOUT" | "INVALID_AI_OUTPUT" | "JSON_PARSE_ERROR" | "SCHEMA_VALIDATION_ERROR" | "UNKNOWN_ERROR";
export class AiServiceError extends Error {
  constructor(public readonly code: AiErrorCode, public readonly status: number, message: string) { super(message); this.name = "AiServiceError"; }
}
export function classifyProviderError(error: unknown): AiServiceError {
  if (error instanceof AiServiceError) return error;
  const message = error instanceof Error ? error.message : String(error); const normalized = message.toLowerCase();
  if (/\b(401)\b/.test(message) || normalized.includes("api key not valid") || normalized.includes("invalid api key")) return new AiServiceError("AUTHENTICATION_FAILED", 401, "The AI provider rejected the server credentials.");
  if (/\b(403)\b/.test(message) || normalized.includes("permission denied")) return new AiServiceError("MODEL_ACCESS_DENIED", 403, "The configured AI model is not available for this API key or account.");
  if (/\b(404)\b/.test(message) || normalized.includes("not found") || normalized.includes("unsupported model")) return new AiServiceError("MODEL_NOT_FOUND", 404, "The configured AI model could not be found.");
  if (/\b(429)\b/.test(message) || normalized.includes("resource_exhausted") || normalized.includes("quota") || normalized.includes("rate limit")) return new AiServiceError("RATE_LIMITED", 429, "The AI service is temporarily rate-limited. Wait briefly and try again.");
  if (/\b(504)\b/.test(message) || /timeout|gateway timeout/i.test(message)) return new AiServiceError("TIMEOUT", 504, "AI generation took too long. Please retry.");
  if (/\b(500|502|503)\b/.test(message) || /network|fetch failed|gateway|service unavailable|internal error/i.test(message)) return new AiServiceError("NETWORK_ERROR", 502, "The AI provider is temporarily unavailable. Please retry.");
  return new AiServiceError("UNKNOWN_ERROR", 502, "The AI provider returned an unusable response.");
}
