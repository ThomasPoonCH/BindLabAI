import { describe, expect, it } from "vitest";
import { convertUnits, dilutionPlan, molarityFromAmount } from "./engine";
import { calculateComponentRatio, calculatePercentVv, calculateAddTo } from "./parts";
import { calculateMassFromMoles, calculateMolarity } from "./chemistry";
describe("pilot dimensional regressions", () => {
  it.each([[1,"L","mL",1000], [500,"uL","mL",0.5], [1,"mol","mmol",1000], [1,"g","mg",1000], [1,"M","uM",1e6]])("converts %s %s to %s", (value, from, to, expected) => expect(convertUnits(value as number, from as string, to as string).value).toBe(expected));
  it("rejects percentage basis changes", () => expect(() => convertUnits(1, "% w/w", "% v/v")).toThrow("bases"));
  it("rejects mass in volume ratios", () => { expect(() => calculateComponentRatio(1,2,3,"g")).toThrow(); expect(() => calculatePercentVv(1,10,"mg")).toThrow(); });
  it("rejects overflow", () => expect(() => calculateAddTo(1e308,1,1e308,"mL")).toThrow());
  it("computes molarity and dilution in mixed units", () => { expect(molarityFromAmount(1,"mmol",500,"uL").valueM).toBe(2); expect(dilutionPlan(1,"M",10,"mM",100,"mL").stockVolume).toBe(1); });
});

it.each([-1, NaN, Infinity])("rejects invalid chemistry numerators %s", value => expect(() => calculateMolarity(value, 1)).toThrow());
it("rejects chemistry result overflow", () => expect(() => calculateMassFromMoles(1e308, 100)).toThrow());
