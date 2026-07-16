import { describe, expect, it } from "vitest";
import { experimentSchema } from "./experiment-schema";
import { buildDeterministicTextDraft } from "./partial-draft";
import { findReagentsInText, matchReagent } from "./reagent-matcher";

const fixtureText = `
Page 2 - 12-COOH reaction preparation
Charge 12-COOH (65 mg), HATU (1.2 equiv), and DIPEA (2 equiv) in DMF.
Page 3 - Add methylamine hydrochloride, then monitor formation of 12-NHMe.
`;

describe("selectable PDF text fallback", () => {
  it("matches canonical names and document-specific labels", () => {
    expect(findReagentsInText(fixtureText)).toEqual(expect.arrayContaining(["HATU", "DIPEA", "methylamine hydrochloride", "DMF", "12-COOH", "12-NHMe"]));
    expect(matchReagent("methylamine hydrochloride")).toMatchObject({ canonicalName: "Methylamine hydrochloride", requiresConfirmation: false });
  });

  it("creates a schema-valid partial record with visible reagent rows", () => {
    const draft = buildDeterministicTextDraft(fixtureText);
    expect(experimentSchema.safeParse(draft).success).toBe(true);
    expect(draft.reagents.map((item) => item.name)).toEqual(expect.arrayContaining(["HATU", "DIPEA", "methylamine hydrochloride", "DMF", "12-COOH", "12-NHMe"]));
    expect(draft.reagents.find((item) => item.name === "12-COOH")).toMatchObject({ mass: 65, massUnit: "mg" });
    expect(draft.reagents.find((item) => item.name === "HATU")).toMatchObject({ equivalents: 1.2, molecularWeight: null });
    expect(draft.reagents.every((item) => item.provenance.confirmedByUser === false)).toBe(true);
    expect(draft.warnings).toContain("The written PDF content was extracted successfully, but visual content has not yet been verified.");
  });

  it("does not invent a reagent that is absent from the text", () => {
    const draft = buildDeterministicTextDraft("Page 1. Dissolve HATU in solvent and review manually.");
    expect(draft.reagents.map((item) => item.name)).toEqual(["HATU"]);
  });
});
