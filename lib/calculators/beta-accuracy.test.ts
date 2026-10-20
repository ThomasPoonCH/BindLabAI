import { describe, expect, it } from "vitest";
import { syntheticExperiment } from "../synthetic-experiment";
import { calculateExperiment } from "../chemistry/experiment-calculations";
import { calculateEquivalents, calculateReactionConcentration, calculatePercentYield, identifyLimitingReagent } from "./synthesis";
import { calculateLcmsDilution, calculateMobilePhaseConsumption, generateGradientTable } from "./lcms";
import { parseWrittenQuantity } from "../ai/written-quantity";
describe("independent beta chemistry reference answers", () => {
  it("applies explicitly entered purity to a weighed reference", () => { const record = syntheticExperiment(); record.reagents[0].purityPercent=90; const plan=calculateExperiment(record); expect(plan.referenceAmountUmol).toBe(900); expect(plan.rows[1].correctedMassMg).toBe(202.5); expect(plan.rows[0].correctedMassMg).toBe(100); });
  it("labels unknown purity and rejects invalid purity", () => { const record=syntheticExperiment(); expect(calculateExperiment(record).warnings.join(" ")).toContain("purity not specified"); record.reagents[0].purityPercent=101; expect(calculateExperiment(record).referenceAmountUmol).toBeNull(); });
  it("rejects overflow without an infinite successful amount", () => { const record=syntheticExperiment(); record.reagents[0].inputValue=1e308; record.reagents[0].inputUnit="mol"; const plan=calculateExperiment(record); expect(plan.referenceAmountUmol).toBeNull(); expect(plan.errors.length).toBeGreaterThan(0); });
  it("checks LCMS aliquot dilution and whole HPLC runs", () => { expect(calculateLcmsDilution(10,990)).toEqual({finalVolumeUl:1000,dilutionFactor:100}); expect(calculateMobilePhaseConsumption(0.4,10,12,10).totalWithExtraMl).toBeCloseTo(52.8); expect(()=>calculateMobilePhaseConsumption(1,10,1.5)).toThrow(); });
  it("has a chronological gradient including return-to-start time", () => { const rows=generateGradientTable(5,95,10,2,0); expect(rows.every((row,i)=>i===0||row.timeMin>=rows[i-1].timeMin)).toBe(true); });
  it("requires explicit stoichiometry for limiting reagent comparison", () => { expect(()=>identifyLimitingReagent([{name:"A",moles:1}])).toThrow("stoichiometric"); expect(identifyLimitingReagent([{name:"A",moles:0.002,stoichiometry:2},{name:"B",moles:0.0015,stoichiometry:1}]).name).toBe("A"); });
  it.each([NaN,Infinity,-1])("rejects invalid synthesis numerator %s", value => { expect(()=>calculateEquivalents(value,1)).toThrow(); expect(()=>calculateReactionConcentration(value,1)).toThrow(); expect(()=>calculatePercentYield(value,1)).toThrow(); });
  it("does not reinterpret an unlabeled final concentration as a stock", () => { expect(parseWrittenQuantity("10 mM final concentration")).not.toHaveProperty("stockConcentration"); });
  it("parses mixed amounts without treating mol as mmol or L as uL", () => { expect(parseWrittenQuantity("0.01 g, 0.001 mol, 500 µL")).toMatchObject({mass:0.01,massUnit:"g",amountMmol:1,volume:500,volumeUnit:"uL"}); expect(parseWrittenQuantity("0.002 L")).toMatchObject({volume:0.002,volumeUnit:"L"}); expect(parseWrittenQuantity("stock 10 mM")).toMatchObject({stockConcentration:10,stockConcentrationUnit:"mM"}); });
});

it("rejects non-finite and overflow LCMS analysis inputs", async () => { const {calculateLcmsDilution,calculateMixedDiluent}=await import("./analysis"); expect(()=>calculateLcmsDilution({mode:"aliquot",finalVialVolumeUl:1000,aliquotVolumeUl:1e308,diluentVolumeUl:1e308})).toThrow(); expect(()=>calculateMixedDiluent(1000,Infinity,1)).toThrow(); });

it("rejects stock volumes larger than the target final reaction volume", () => { const record=syntheticExperiment(); record.reagents[1].physicalState="stock_solution"; record.reagents[1].stockConcentration=0.01; const plan=calculateExperiment(record); expect(plan.rows[1].stockVolumeUl).toBe(150000); expect(plan.errors.join(" ")).toContain("exceed the target final reaction volume"); });
