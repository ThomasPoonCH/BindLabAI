import { describe, expect, it } from "vitest";
import { buildDeviations, calculateAmendment, calculatePlan, currentConcentration } from "./calculations";
import { demoPlan, initialBenchSession } from "./demo-data";
import { nextActionFor } from "./decision-rules";

describe("Live Bench Mode deterministic calculations", () => {
  it("rescales all dependent quantities from actual substrate mass", () => {
    const original = calculatePlan(demoPlan, 20);
    const updated = calculatePlan(demoPlan, 20.6);
    expect(updated.scaleFactor).toBeCloseTo(1.03);
    expect(updated.hatuMassMg / original.hatuMassMg).toBeCloseTo(1.03);
    expect(updated.methylamineMassMg / original.methylamineMassMg).toBeCloseTo(1.03);
    expect(updated.dipeaVolumeUl / original.dipeaVolumeUl).toBeCloseTo(1.03);
    expect(updated.dmfVolumeUl / original.dmfVolumeUl).toBeCloseTo(1.03);
  });

  it("derives concentration and deviation from confirmed solvent volume", () => {
    const session = initialBenchSession();
    session.actuals.dmf = { reagent: "dmf", value: 850, unit: "uL", confirmedAt: new Date().toISOString() };
    expect(currentConcentration(session)).toBeCloseTo(session.updatedPlan.substrateMmol / 0.85);
    expect(buildDeviations(demoPlan, session)[0].consequence).toContain("Estimated substrate concentration");
  });

  it("calculates a 0.5x amendment from the current scale", () => {
    const amendment = calculateAmendment(calculatePlan(demoPlan, 20.6));
    expect(amendment.hatu.addEq).toBe(0.5);
    expect(amendment.hatu.amount).toBeGreaterThan(0);
    expect(amendment.dipea.unit).toBe("uL");
  });

  it("changes the ranked next action with the analytical scenario", () => {
    const session = initialBenchSession();
    expect(nextActionFor("partial-conversion", session).state).toBe("Partial conversion likely");
    expect(nextActionFor("inconclusive", session).recommendation).toContain("repeat analysis");
    expect(nextActionFor("product-dominant", session).recommendation).toContain("approved work-up");
  });
});
