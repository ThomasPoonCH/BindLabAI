import { describe, expect, it } from "vitest";
import { parseProjectReagents } from "./project-reagent-repository";

describe("project reagent repository", () => {
  it("accepts only explicitly user-confirmed project records", () => {
    const record = { id: "project-1", projectId: null, name: "Custom substrate", aliases: ["12-COOH"], molecularWeight: 411.457, density: null, physicalForm: "solid", source: "user_confirmed", createdAt: "2026-07-16", updatedAt: "2026-07-16" };
    expect(parseProjectReagents([record, { ...record, id: "bad", source: "suggested_by_ai" }])).toEqual([record]);
  });
  it("does not create a record from missing or malformed storage", () => {
    expect(parseProjectReagents(null)).toEqual([]);
    expect(parseProjectReagents([{ name: "AI guess" }])).toEqual([]);
  });
});
