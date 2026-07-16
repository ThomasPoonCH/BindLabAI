import { describe, expect, it } from "vitest";
import { mergeVisualRetryDraft, resolveBuilderResponse } from "./builder-response";
import { buildDeterministicTextDraft } from "./partial-draft";

describe("experiment builder response handling", () => {
  it("accepts a validated partial draft despite ok=false", () => {
    const partialDraft = buildDeterministicTextDraft("Page 1. Add HATU and DIPEA to DMF.");
    const result = resolveBuilderResponse({
      ok: false,
      code: "VISUAL_ANALYSIS_TIMEOUT",
      error: { code: "VISUAL_ANALYSIS_TIMEOUT", requestId: "safe-id" },
      partialDraft,
    });
    expect(result.kind).toBe("draft");
    if (result.kind === "draft") {
      expect(result.warning?.code).toBe("VISUAL_ANALYSIS_TIMEOUT");
      expect(result.draft.reagents.map((item) => item.name)).toEqual(expect.arrayContaining(["HATU", "DIPEA", "DMF"]));
    }
  });

  it("rejects an invalid partial instead of exposing it to the workspace", () => {
    expect(resolveBuilderResponse({ ok: false, partialDraft: { title: "invalid" } })).toEqual({ kind: "error", error: { code: "SCHEMA_VALIDATION_ERROR" } });
  });

  it("uses a generic failure only when no usable draft exists", () => {
    expect(resolveBuilderResponse({ ok: false, error: { code: "TIMEOUT" } })).toEqual({ kind: "error", error: { code: "TIMEOUT" } });
  });

  it("preserves user edits when visual analysis is retried", () => {
    const current = buildDeterministicTextDraft("Page 1. Add HATU and DIPEA.");
    current.title = "User edited title";
    current.reagents[0].equivalents = 1.5;
    const visual = buildDeterministicTextDraft("Page 2. Add HATU, DIPEA, and DMF.");
    visual.title = "AI replacement title";
    visual.reagents[0].equivalents = 2;
    const merged = mergeVisualRetryDraft(current, visual);
    expect(merged.title).toBe("User edited title");
    expect(merged.reagents.find((item) => item.name === "HATU")?.equivalents).toBe(1.5);
    expect(merged.reagents.map((item) => item.name)).toContain("DMF");
  });
});
