import { experimentSchema, type ExperimentRecord } from "./ai/experiment-schema";
import { calculateExperiment } from "./chemistry/experiment-calculations";
import { fieldEvidence, evidenceLabels, initializeUntrustedEvidence } from "./experiment-evidence";

import { csvCell } from "./csv";
export { csvCell } from "./csv";
export function experimentCsv(record: ExperimentRecord): string {
  const plan = calculateExperiment(record);
  const rows: unknown[][] = [["Section", "Reagent / field", "Value", "Unit", "Status", "Source reference", "Source excerpt", "Notes"]];
  rows.push(["Experiment", "Title", record.title, "", record.experimentStatus, "", "", "Prototype preparation sheet — requires independent verification; blank means not established."]);
  for (const reagent of record.reagents) {
    const quantities = [
      ["name", reagent.name, ""], ["molecularWeight", reagent.molecularWeight, "g/mol"], ["mass", reagent.mass, reagent.massUnit], ["volume", reagent.volume, reagent.volumeUnit], ["amountMmol", reagent.amountMmol, "mmol"], ["equivalents", reagent.equivalents, "equiv"], ["stockConcentration", reagent.stockConcentration, reagent.stockConcentrationUnit], ["density", reagent.density, reagent.densityUnit], ["purityPercent", reagent.purityPercent, "%"], ["inputValue", reagent.inputValue, reagent.inputUnit],
    ] as const;
    for (const [key, value, unit] of quantities) {
      const evidence = fieldEvidence(value, reagent.fieldEvidence?.[key]);
      rows.push([reagent.name, key, value, unit, evidenceLabels[evidence.status], evidence.sourceReference, evidence.sourceExcerpt, key === "stockConcentration" ? "Stock concentration, not final reaction concentration" : "Source/input value; see calculated rows for rescaled quantities"]);
    }
    const calculated = plan.rows.find(row => row.id === reagent.id);
    if (calculated && !plan.errors.length) for (const [key, value, unit] of [["Rescaled amount", calculated.amountUmol === null ? null : calculated.amountUmol / 1000, "mmol"], ["Rescaled mass", calculated.correctedMassMg, "mg"], ["Neat liquid volume", calculated.liquidVolumeUl, "uL"], ["Stock volume", calculated.stockVolumeUl, "uL"], ["Final reaction concentration", calculated.actualConcentrationM, "M"]]) rows.push([reagent.name, key, value, unit, value === null ? "Missing / Unverified" : "Calculated", "BindLab deterministic engine", "", "Verify source inputs before use"]);
  }
  for (const [key, unit] of [["solvent", ""], ["targetConcentration", record.conditions.targetConcentrationUnit], ["solventVolume", record.conditions.solventVolumeUnit], ["temperature", record.conditions.temperatureUnit], ["duration", record.conditions.durationUnit], ["atmosphere", ""], ["vessel", ""], ["mixingMethod", ""], ["orderOfAddition", ""]] as const) {
    const value = record.conditions[key]; const evidence = fieldEvidence(value, record.conditions.fieldEvidence?.[key]);
    rows.push(["Conditions", key, Array.isArray(value) ? value.join("; ") : value, unit, evidenceLabels[evidence.status], evidence.sourceReference, evidence.sourceExcerpt]);
  }
  if (!plan.errors.length) rows.push(["Conditions", "Calculated total reaction volume", plan.totalVolumeMl, "mL", plan.totalVolumeMl === null ? "Missing / Unverified" : "Calculated", "BindLab deterministic engine", "", "Final solution volume; stock solution volume is part of this total"]);
  for (const key of ["workup", "purification", "notes", "expectedProduct", "expectedMolecularWeight", "safetyNotes"] as const) { const value = record[key]; const evidence = fieldEvidence(value, record.fieldEvidence?.[key]); rows.push(["Procedure", key, Array.isArray(value) ? value.join("; ") : value, key === "expectedMolecularWeight" ? "g/mol" : "", evidenceLabels[evidence.status], evidence.sourceReference, evidence.sourceExcerpt]); }
  for (const warning of [...record.missingInformation, ...record.conflicts, ...record.warnings, ...plan.errors, ...plan.warnings]) rows.push(["Review", "Issue", warning]);
  return "\uFEFF" + rows.map(row => Array.from({ length: 8 }, (_, index) => csvCell(row[index])).join(",")).join("\r\n") + "\r\n";
}
export function experimentBackup(records: ExperimentRecord[]) { return JSON.stringify({ format: "bindlab-experiments", version: 1, exportedAt: new Date().toISOString(), experiments: records.map(record => experimentSchema.parse(record)) }, null, 2); }
export function parseExperimentBackup(text: string): ExperimentRecord[] {
  if (new TextEncoder().encode(text).length > 5 * 1024 * 1024) throw new Error("Backup must be 5 MB or smaller.");
  let raw; try { raw = JSON.parse(text); } catch { throw new Error("The backup is not valid JSON. No records were imported."); }
  if (raw?.format !== "bindlab-experiments" || raw.version !== 1 || !Array.isArray(raw.experiments) || raw.experiments.length > 100) throw new Error("Unsupported backup. Use a BindLab version 1 backup with at most 100 records.");
  return raw.experiments.map((item: unknown) => { const parsed = experimentSchema.safeParse(item); if (!parsed.success) throw new Error("Backup contains an invalid experiment. No records were imported."); return initializeUntrustedEvidence(parsed.data); });
}
export function downloadFile(contents: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
