import { describe, it, expect } from "vitest";
import { syntheticExperiment } from "./synthetic-experiment";
import { initializeUntrustedEvidence, recordEdits, confirmEvidence, verificationIssues } from "./experiment-evidence";
import { experimentSchema } from "./ai/experiment-schema";
import { resolveBuilderResponse } from "./ai/builder-response";
describe("field evidence", () => {
  it("requires an explicit action for confirmation and preserves source evidence", () => {
    const record = syntheticExperiment(); const row = record.reagents[0];
    const edited = recordEdits(row, { mass: 200 });
    expect(edited.fieldEvidence?.mass.status).toBe("researcher_confirmed");
    expect(edited.fieldEvidence?.name.status).toBe("source_extracted");
    expect(edited.fieldEvidence?.mass.sourceReference).toBe(row.fieldEvidence?.mass.sourceReference);
    expect(edited.fieldEvidence?.mass.sourceExcerpt).toBe(row.fieldEvidence?.mass.sourceExcerpt);
  });
  it("does not confirm adjacent conditions", () => { const record = syntheticExperiment(); const conditions = recordEdits(record.conditions, { temperature: "30" }); expect(conditions.fieldEvidence?.temperature.status).toBe("researcher_confirmed"); expect(conditions.fieldEvidence?.duration.status).toBe("source_extracted"); });
  it("strips AI confirmation even in field-level evidence", () => { const draft = syntheticExperiment(); draft.reagents[0].fieldEvidence!.mass = confirmEvidence(); const result = resolveBuilderResponse({ draft }); expect(result.kind).toBe("draft"); if (result.kind === "draft") expect(result.draft.reagents[0].fieldEvidence?.mass.status).not.toBe("researcher_confirmed"); });
  it("keeps missing fields unverified and flags execution review", () => { const record = initializeUntrustedEvidence(syntheticExperiment()); expect(record.conditions.fieldEvidence?.atmosphere.status).toBe("unverified"); expect(verificationIssues(record).join(" ")).toContain("Safety review"); expect(record.experimentStatus).toBe("needs_review"); });
  it("round-trips confirmations through the schema", () => { const record = syntheticExperiment(); record.reagents[0].fieldEvidence!.mass = confirmEvidence(); expect(experimentSchema.parse(JSON.parse(JSON.stringify(record))).reagents[0].fieldEvidence?.mass.status).toBe("researcher_confirmed"); });
});

it("keeps confirmed values and evidence when an AI retry conflicts", async () => {
  const { mergeDraft, findConflicts } = await import("./experiment-workflow");
  const current = syntheticExperiment(); current.reagents[0] = recordEdits(current.reagents[0], { mass: 200 });
  const incoming = syntheticExperiment();
  const conflicts = findConflicts(current, incoming); expect(conflicts.some(c => c.field === "reagent:alpha:mass")).toBe(true);
  const merged = mergeDraft(current, incoming, { "reagent:alpha:mass": "keep" }); expect(merged.reagents[0].mass).toBe(200); expect(merged.reagents[0].fieldEvidence?.mass.status).toBe("researcher_confirmed");
});

it("does not silently replace a contradictory source molecular weight with a library value", async () => { const {resolveReagentProperties}=await import("./chemistry/reagent-resolution"); const source=syntheticExperiment().reagents[0]; source.name="HATU"; source.molecularWeight=999; const resolved=resolveReagentProperties(source); expect(resolved.molecularWeight).toBe(999); expect(resolved.propertyVerificationStatus).toBe("unresolved"); expect(resolved.propertySource).toContain("Source/database conflict"); });

it("retains confirmed procedure and addition-order evidence when applying another draft", async () => { const {mergeDraft,findConflicts}=await import("./experiment-workflow"); const current=syntheticExperiment();current.notes="Researcher notes";current.conditions.orderOfAddition=["Explicit step A"];current.conditions.solventVolume=2; const incoming=syntheticExperiment();incoming.notes="Different source notes";incoming.conditions.orderOfAddition=["Different step"];incoming.conditions.solventVolume=3; const fields=findConflicts(current,incoming).map(c=>c.field);expect(fields).toEqual(expect.arrayContaining(["notes","orderOfAddition","solventVolume"]));const merged=mergeDraft(current,incoming,{notes:"keep",orderOfAddition:"keep",solventVolume:"keep"});expect(merged.notes).toBe("Researcher notes");expect(merged.conditions.orderOfAddition).toEqual(["Explicit step A"]);expect(merged.conditions.solventVolume).toBe(2); });

it("does not apply an empty workspace default unit to an incoming source volume", async () => {const {mergeDraft}=await import("./experiment-workflow");const current=syntheticExperiment();const incoming=syntheticExperiment();incoming.conditions.solventVolume=2;incoming.conditions.solventVolumeUnit="L";const merged=mergeDraft(current,incoming,{});expect(merged.conditions.solventVolume).toBe(2);expect(merged.conditions.solventVolumeUnit).toBe("L");});
