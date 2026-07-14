import { describe, expect, it } from "vitest";
import { formatAiError } from "./errors";

describe("formatAiError", () => {
  it("maps Gemini quota and resource exhausted errors to a friendly message", () => {
    expect(formatAiError(new Error("429 RESOURCE_EXHAUSTED quota exceeded"))).toBe(
      "AI service quota exceeded. Please check Gemini API billing/rate limits or try again later."
    );
  });

  it("does not expose unexpected provider error text", () => {
    expect(formatAiError(new Error("Internal error encountered with sensitive details"))).toBe("AI provider returned an internal error. Please try again later.");
  });

  it("maps overload errors to a friendly message", () => {
    expect(formatAiError(new Error("503 Service Unavailable high demand"))).toBe(
      "AI service is temporarily overloaded. Please try again later."
    );
  });
});
