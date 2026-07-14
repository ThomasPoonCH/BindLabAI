export function formatAiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    normalizedMessage.includes("resource_exhausted") ||
    normalizedMessage.includes("quota exceeded") ||
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("rate limit")
  ) {
    return "AI service quota exceeded. Please check Gemini API billing/rate limits or try again later.";
  }

  if (message.includes("503 Service Unavailable") || message.includes("high demand")) {
    return "AI service is temporarily overloaded. Please try again later.";
  }

  if (message.includes("500") || normalizedMessage.includes("internal error")) {
    return "AI provider returned an internal error. Please try again later.";
  }

  if (message.includes("API key not valid") || message.includes("invalid")) {
    return "Gemini API key was rejected. Please create a new key in Google AI Studio and update .env.local.";
  }

  return "AI request could not be completed. Check the model access and try again.";
}
