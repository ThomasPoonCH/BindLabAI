import { describe, expect, it } from "vitest";
import { syntheticExperiment } from "./synthetic-experiment";
import { calculateExperiment } from "./chemistry/experiment-calculations";
import { csvCell, experimentCsv, experimentBackup, parseExperimentBackup } from "./experiment-export";
describe("safe Excel-compatible preparation export", () => {
  it.each(["=1+1", "+cmd", "-1+1", "@SUM(A1)", "  =1", "\t=1", "\r=1", "\n=1"])("neutralizes formula prefix %j", value => expect(csvCell(value)).toBe('"\'' + value + '"'));
  it("escapes delimiters and keeps numbers numeric", () => { expect(csvCell('a,"b\nc')).toBe('"a,""b\nc"'); expect(csvCell(-1)).toBe('"-1"'); expect(csvCell(null)).toBe('""'); });
  it("exports independently checked fictional amounts and explicit units", () => {
    const record = syntheticExperiment(); const plan = calculateExperiment(record);
    expect(plan.referenceAmountUmol).toBe(1000); expect(plan.rows[1].amountUmol).toBe(1500); expect(plan.rows[1].correctedMassMg).toBe(225); expect(plan.totalVolumeMl).toBe(10);
    const csv = experimentCsv(record); expect(csv).toContain('"Fictional Beta","Rescaled mass","225","mg","Calculated"'); expect(csv).toContain('"temperature","25","C","Source Extracted"'); expect(csv).toContain('"stockConcentration","","M","Missing / Unverified"');
    record.reagents[0].inputValue = 200; const scaled = experimentCsv(record); expect(scaled).toContain('"Fictional Beta","Rescaled mass","450","mg","Calculated"');
  });
  it("does not export invalid partial calculations as calculated quantities", () => { const record = syntheticExperiment(); record.reagents[0].molecularWeight = null; expect(experimentCsv(record)).not.toContain('"Rescaled mass"'); });
  it("exports calculation warnings and labels unknown total volume as missing", () => {
    const record = syntheticExperiment();
    const plan = calculateExperiment(record);
    expect(plan.warnings.length).toBeGreaterThan(0);
    for (const warning of plan.warnings) expect(experimentCsv(record)).toContain(csvCell(warning));
    record.conditions.targetConcentration = null;
    record.conditions.solventVolume = null;
    expect(experimentCsv(record)).toContain('"Calculated total reaction volume","","mL","Missing / Unverified"');
  });
  it("round-trips a backup but requires renewed confirmation", () => { const record = syntheticExperiment(); record.reagents[0].fieldEvidence!.mass.status = "researcher_confirmed"; const [imported] = parseExperimentBackup(experimentBackup([record])); expect(imported.reagents[0].mass).toBe(100); expect(imported.reagents[0].fieldEvidence?.mass.status).not.toBe("researcher_confirmed"); });
  it.each(['{}', '{"format":"bindlab-experiments","version":2,"experiments":[]}', '{"format":"bindlab-experiments","version":1,"experiments":[{}]}'])("rejects invalid backups", text => expect(() => parseExperimentBackup(text)).toThrow());
});

it("protects the legacy reagent CSV exporter too", async () => { const {makeReagentCsv}=await import("./calculators/reaction"); const csv=makeReagentCsv([{name:"=SUM(A1)",role:"reactant",state:"solid",equivalents:1,mmol:1,massMg:1,liquidVolumeUl:null,stockSolutionVolumeUl:null,displayAmount:"1 mg",missingData:[],id:"test"}]); expect(csv).toContain('"\'=SUM(A1)"'); });
