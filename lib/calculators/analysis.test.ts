import { describe, expect, it } from "vitest";
import { calculateLcmsDilution, calculateMixedDiluent } from "./analysis";

describe("analysis plan calculations", () => {
  it("calculates a 1:x LCMS dilution", () => {
    const result = calculateLcmsDilution({ mode: "factor", finalVialVolumeUl: 200, dilutionFactor: 20 });
    expect(result.sampleVolumeUl).toBe(10);
    expect(result.diluentVolumeUl).toBe(190);
  });
  it("calculates a fold dilution from an aliquot", () => {
    const result = calculateLcmsDilution({ mode: "aliquot", finalVialVolumeUl: 0, aliquotVolumeUl: 5, diluentVolumeUl: 95 });
    expect(result.foldDilution).toBe(20);
  });
  it("splits a mixed ACN:H2O diluent", () => {
    const result = calculateMixedDiluent(190, 4, 6);
    expect(result.volumeA).toBe(76);
    expect(result.volumeB).toBe(114);
  });
});
