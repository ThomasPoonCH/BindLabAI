import { describe, expect, it } from "vitest";
import { getGeminiFallbackModelName, getGeminiModelName, runWithModelFallback } from "./gemini";

describe("getGeminiModelName", () => {
  it("defaults to Gemma 4 31B", () => {
    expect(getGeminiModelName()).toBe("gemma-4-31b-it");
  });

  it("allows GEMINI_MODEL to override the default", () => {
    expect(getGeminiModelName("gemini-3-flash-preview")).toBe("gemini-3-flash-preview");
  });

  it("defaults the fallback to the verified Flash alias", () => {
    expect(getGeminiFallbackModelName()).toBe("gemini-flash-latest");
  });

  it("retries temporary provider errors then uses the fallback model", async () => {
    const calls: string[] = [];
    const result = await runWithModelFallback(async (model) => {
      calls.push(model);
      if (model === "gemma-4-31b-it") throw new Error("500 Internal Server Error");
      return "fallback response";
    }, "gemma-4-31b-it", "gemini-flash-latest", async () => undefined);
    expect(calls).toEqual(["gemma-4-31b-it", "gemma-4-31b-it", "gemma-4-31b-it", "gemini-flash-latest"]);
    expect(result.metadata).toMatchObject({ fallbackUsed: true, successfulModel: "gemini-flash-latest", attemptCount: 4, preferredAttemptCount: 3 });
  });

  it("does not retry invalid credentials", async () => {
    let calls = 0;
    await expect(runWithModelFallback(async () => { calls += 1; throw new Error("401 invalid API key"); }, "gemma-4-31b-it", "gemini-flash-latest", async () => undefined)).rejects.toThrow("401");
    expect(calls).toBe(1);
  });
});
