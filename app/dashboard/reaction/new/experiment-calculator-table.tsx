"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BookOpenCheck, ChevronDown, Plus, Save, Trash2 } from "lucide-react";
import type { ExperimentRecord } from "@/lib/ai/experiment-schema";
import { calculateExperiment } from "@/lib/chemistry/experiment-calculations";
import { formatNumber, type InputUnit } from "@/lib/chemistry/reaction-calculator";
import { applyVerifiedRecord, resolveReagentProperties } from "@/lib/chemistry/reagent-resolution";
import { normalizeChemicalName, resolveVerifiedReagent } from "@/lib/chemistry/verified-reagents";
import { listProjectReagents, saveProjectReagent } from "@/lib/project-reagent-repository";

type Reagent = ExperimentRecord["reagents"][number];
const inputClass = "min-w-24 rounded border border-ink/15 bg-white px-2 py-1.5 text-sm";
const units: InputUnit[] = ["ug", "mg", "g", "nmol", "umol", "mmol", "mol", "uL", "mL", "L"];
const roles = ["reactant", "reagent", "catalyst", "base", "acid", "ligand", "additive", "solvent", "quench", "other"];
const forms = ["solid", "liquid", "stock_solution", "gas", "unknown"] as const;
const sourceLabel = (reagent: Reagent) => reagent.propertyVerificationStatus === "bindlab_verified" ? "From reagent library" : reagent.propertyVerificationStatus === "user_confirmed" ? "User confirmed" : reagent.provenance.sourceType === "imported_from_text" || reagent.provenance.sourceType === "imported_from_document" ? "From PDF" : reagent.provenance.sourceType === "suggested_by_ai" ? "AI suggestion" : "User input";

export function ExperimentCalculatorTable({ record, onChange, onNotice }: { record: ExperimentRecord; onChange: (record: ExperimentRecord) => void; onNotice: (message: string) => void }) {
  const plan = useMemo(() => calculateExperiment(record), [record]);
  const [openExplanation, setOpenExplanation] = useState<string | null>(null);
  const updateRow = (index: number, patch: Partial<Reagent>, resolveName = false) => {
    const rows = record.reagents.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      const updated = { ...row, ...patch, provenance: patch.provenance ?? row.provenance };
      return resolveName ? resolveReagentProperties(updated) : updated;
    });
    onChange({ ...record, reagents: rows, updatedAt: new Date().toISOString() });
  };
  const updateName = (index: number, name: string) => {
    const original = record.reagents[index];
    const base = { ...original, name, canonicalReagentId: null, canonicalName: null, molecularWeight: null, density: null, propertyVerificationStatus: "unresolved" as const };
    let resolved = resolveReagentProperties(base);
    if (resolved.propertyVerificationStatus === "unresolved") {
      const project = listProjectReagents().find(item => [item.name, ...item.aliases].some(alias => normalizeChemicalName(alias) === normalizeChemicalName(name)));
      if (project) resolved = { ...resolved, canonicalReagentId: project.id, canonicalName: project.name, molecularWeight: project.molecularWeight, density: project.density, physicalState: project.physicalForm, propertySource: "Project reagent library", propertyVerifiedAt: project.updatedAt, propertyVerificationStatus: "user_confirmed" };
    }
    updateRow(index, resolved);
  };
  const remove = (index: number) => onChange({ ...record, reagents: record.reagents.filter((_, i) => i !== index), updatedAt: new Date().toISOString() });
  const add = () => {
    const timestamp = new Date().toISOString();
    onChange({ ...record, reagents: [...record.reagents, { id: crypto.randomUUID(), name: null, role: "reagent", physicalState: "unknown", molecularWeight: null, molecularWeightUnit: "g/mol", mass: null, massUnit: "mg", amountMmol: null, equivalents: null, density: null, densityUnit: "g/mL", stockConcentration: null, stockConcentrationUnit: "M", volume: null, volumeUnit: null, isLimitingReagent: record.reagents.length === 0, inputValue: null, inputUnit: "mg", purityPercent: null, propertyVerificationStatus: "unresolved", provenance: { sourceType: "user_entered", sourceText: null, sourceReference: null, confidence: null, confirmedByUser: true, createdAt: timestamp, updatedAt: timestamp } }], updatedAt: timestamp });
  };
  const confirmManual = (index: number) => {
    const reagent = record.reagents[index];
    if (!reagent.name?.trim() || !reagent.molecularWeight || reagent.molecularWeight <= 0) return onNotice("Enter a reagent name and a positive MW before confirming manual properties.");
    updateRow(index, { canonicalName: reagent.name, propertyVerificationStatus: "user_confirmed", propertySource: "User-confirmed property", propertyVerifiedAt: new Date().toISOString(), provenance: { ...reagent.provenance, sourceType: "user_entered", confirmedByUser: true, updatedAt: new Date().toISOString() } });
    onNotice(`${reagent.name} properties marked as user confirmed for this experiment.`);
  };
  const saveProject = (reagent: Reagent) => {
    if (reagent.propertyVerificationStatus !== "user_confirmed" || !reagent.name) return;
    saveProjectReagent({ projectId: null, name: reagent.name, aliases: [], molecularWeight: reagent.molecularWeight, density: reagent.density, physicalForm: reagent.physicalState ?? "unknown" });
    onNotice(`${reagent.name} saved to this browser's project reagent library.`);
  };

  return (
    <section className="mt-5 border-t border-ink/10 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-semibold">Reaction calculator</h2><p className="mt-1 text-sm text-ink/60">Editable inputs update immediately. AI is never used for arithmetic.</p></div>
        <p className="rounded bg-mint px-3 py-2 text-xs font-semibold text-moss">All equivalents and required quantities are calculated relative to the confirmed reference reagent.</p>
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border border-ink/10">
        <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-[0.08em] text-ink/65"><tr>{["Reference", "Reagent / canonical match", "Role / form", "MW / density", "Entered amount", "Equiv.", "Purity", "Calculated amount", "Required mass", "Volume", "Source / status", ""].map((label) => <th key={label} className="border-b border-ink/10 px-3 py-3">{label}</th>)}</tr></thead>
          <tbody>{record.reagents.filter((row) => row.role !== "product").map((reagent, visibleIndex) => {
            const index = record.reagents.findIndex((row) => row.id === reagent.id);
            const result = plan.rows.find((row) => row.id === reagent.id);
            const resolution = reagent.name ? resolveVerifiedReagent(reagent.name) : null;
            const isSolvent = reagent.role === "solvent";
            return <tr key={reagent.id} className="align-top odd:bg-white even:bg-paper/50">
              <td className="px-3 py-3"><input aria-label={`Reference ${reagent.name ?? visibleIndex + 1}`} type="radio" checked={reagent.isLimitingReagent} disabled={isSolvent} onChange={() => onChange({ ...record, reagents: record.reagents.map((row) => ({ ...row, isLimitingReagent: row.id === reagent.id, equivalents: row.id === reagent.id ? 1 : row.equivalents })) })} /></td>
              <td className="px-3 py-3"><input aria-label={`Reagent name ${visibleIndex + 1}`} className={`${inputClass} w-52`} value={reagent.name ?? ""} onChange={(event) => updateName(index, event.target.value)} /><p className="mt-1 max-w-52 text-xs text-ink/55">{reagent.canonicalName ?? (resolution?.suggestions[0] ? `Suggested: ${resolution.suggestions[0].canonicalName}` : "No verified match")}</p>{resolution?.suggestions.length ? <select aria-label={`Suggested match ${visibleIndex + 1}`} className={`${inputClass} mt-2 w-52`} defaultValue="" onChange={(event) => event.target.value && updateRow(index, applyVerifiedRecord(reagent, event.target.value))}><option value="">Choose suggested match</option>{resolution.suggestions.map(item => <option key={item.id} value={item.id}>{item.canonicalName}{item.saltOrSolvateForm ? ` (${item.saltOrSolvateForm})` : ""}</option>)}</select> : null}</td>
              <td className="px-3 py-3"><select aria-label={`Role ${visibleIndex + 1}`} className={inputClass} value={reagent.role ?? "reagent"} onChange={(event) => updateRow(index, { role: event.target.value })}>{roles.map(role => <option key={role}>{role}</option>)}</select><select aria-label={`Physical form ${visibleIndex + 1}`} className={`${inputClass} mt-2`} value={reagent.physicalState ?? "unknown"} onChange={(event) => updateRow(index, { physicalState: event.target.value as Reagent["physicalState"] })}>{forms.map(form => <option key={form}>{form}</option>)}</select></td>
              <td className="px-3 py-3"><label className="grid gap-1 text-xs">MW (g/mol)<input aria-label={`MW ${visibleIndex + 1}`} type="number" min="0" className={inputClass} value={reagent.molecularWeight ?? ""} onChange={(event) => updateRow(index, { molecularWeight: event.target.value ? Number(event.target.value) : null, propertyVerificationStatus: "unresolved" })} /></label><label className="mt-2 grid gap-1 text-xs">Density<div className="flex"><input aria-label={`Density ${visibleIndex + 1}`} type="number" min="0" className={inputClass} value={reagent.density ?? ""} onChange={(event) => updateRow(index, { density: event.target.value ? Number(event.target.value) : null, propertyVerificationStatus: "unresolved" })} /><select aria-label={`Density unit ${visibleIndex + 1}`} className={inputClass} value={reagent.densityUnit} onChange={(event) => updateRow(index, { densityUnit: event.target.value as "g/mL" | "mg/mL" })}><option>g/mL</option><option>mg/mL</option></select></div></label></td>
              <td className="px-3 py-3"><div className="flex"><input aria-label={`Entered amount ${visibleIndex + 1}`} type="number" min="0" className={inputClass} value={reagent.inputValue ?? (reagent.isLimitingReagent ? reagent.mass ?? reagent.amountMmol ?? "" : "")} onChange={(event) => updateRow(index, { inputValue: event.target.value ? Number(event.target.value) : null })} /><select aria-label={`Entered unit ${visibleIndex + 1}`} className={inputClass} value={reagent.inputUnit ?? (reagent.mass !== null ? reagent.massUnit ?? "mg" : reagent.amountMmol !== null ? "mmol" : "mg")} onChange={(event) => updateRow(index, { inputUnit: event.target.value as InputUnit })}>{units.map(unit => <option key={unit}>{unit}</option>)}</select></div><span className="mt-1 block text-[11px] font-semibold text-copper">User input</span></td>
              <td className="px-3 py-3"><input aria-label={`Equivalents ${visibleIndex + 1}`} type="number" min="0" step="0.1" disabled={reagent.isLimitingReagent || isSolvent} className={inputClass} value={reagent.isLimitingReagent ? 1 : reagent.equivalents ?? ""} onChange={(event) => updateRow(index, { equivalents: event.target.value ? Number(event.target.value) : null })} /></td>
              <td className="px-3 py-3"><div className="flex items-center"><input aria-label={`Purity ${visibleIndex + 1}`} type="number" min="0.01" max="100" className={inputClass} value={reagent.purityPercent ?? ""} onChange={(event) => updateRow(index, { purityPercent: event.target.value ? Number(event.target.value) : null })} /><span className="ml-1">%</span></div></td>
              <td className="px-3 py-3 font-semibold">{result?.amountUmol != null ? `${formatNumber(result.amountUmol)} umol` : isSolvent ? "From concentration" : "Needs input"}<span className="mt-1 block text-[11px] text-copper">Calculated by BindLab</span></td>
              <td className="px-3 py-3">{result?.theoreticalMassMg != null ? <><strong>{formatNumber(result.theoreticalMassMg)} mg</strong>{result.correctedMassMg !== result.theoreticalMassMg && result.correctedMassMg != null ? <p className="mt-1 text-xs">Weigh {formatNumber(result.correctedMassMg)} mg corrected</p> : null}</> : isSolvent ? "Not an addition" : "MW required"}</td>
              <td className="px-3 py-3">{result?.liquidVolumeUl != null ? `${formatNumber(result.liquidVolumeUl)} uL neat` : result?.stockVolumeUl != null ? `${formatNumber(result.stockVolumeUl)} uL stock` : reagent.physicalState === "liquid" ? "Density required" : reagent.physicalState === "stock_solution" ? "Stock concentration required" : "—"}{reagent.physicalState === "stock_solution" && <label className="mt-2 grid gap-1 text-xs">Stock concentration<div className="flex"><input aria-label={`Stock concentration ${visibleIndex + 1}`} type="number" min="0" className={inputClass} value={reagent.stockConcentration ?? ""} onChange={(event) => updateRow(index, { stockConcentration: event.target.value ? Number(event.target.value) : null })} /><select aria-label={`Stock concentration unit ${visibleIndex + 1}`} className={inputClass} value={reagent.stockConcentrationUnit} onChange={(event) => updateRow(index, { stockConcentrationUnit: event.target.value as "uM" | "mM" | "M" })}><option>uM</option><option>mM</option><option>M</option></select></div></label>}</td>
              <td className="px-3 py-3"><span className="rounded bg-white px-2 py-1 text-xs font-semibold">{sourceLabel(reagent)}</span><p className="mt-2 max-w-44 text-xs text-ink/55">{reagent.propertySource ?? reagent.provenance.sourceReference ?? "Confirmation required"}</p>{reagent.propertyVerificationStatus === "unresolved" || reagent.propertyVerificationStatus === "ai_suggested" ? <button onClick={() => confirmManual(index)} className="mt-2 rounded border border-copper/40 px-2 py-1 text-xs font-semibold text-copper">Confirm manual properties</button> : null}{reagent.propertyVerificationStatus === "user_confirmed" ? <button onClick={() => saveProject(reagent)} className="mt-2 inline-flex items-center gap-1 rounded border border-ink/15 px-2 py-1 text-xs"><Save size={12} />Save as project reagent</button> : null}</td>
              <td className="px-3 py-3"><button title="Remove reagent" onClick={() => remove(index)} className="rounded border border-ink/15 p-2"><Trash2 size={14} /></button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <button onClick={add} className="mt-3 inline-flex items-center gap-2 rounded border border-ink/20 px-3 py-2 text-sm font-semibold"><Plus size={15} />Add reagent</button>

      <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded bg-paper p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Reference amount</p><p className="mt-1 text-lg font-semibold">{plan.referenceAmountUmol !== null ? `${formatNumber(plan.referenceAmountUmol)} umol` : "Needs input"}</p></div><div className="rounded bg-paper p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Calculated reaction volume</p><p className="mt-1 text-lg font-semibold">{plan.totalVolumeMl !== null ? `${formatNumber(plan.totalVolumeMl)} mL` : "Needs target concentration"}</p></div><div className="rounded bg-paper p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">Actual concentration</p><p className="mt-1 text-lg font-semibold">{plan.actualConcentrationM !== null ? `${formatNumber(plan.actualConcentrationM)} M` : "—"}</p></div></div>

      {(plan.errors.length > 0 || plan.warnings.length > 0) && <div className="mt-4 grid gap-2">{plan.errors.map(error => <p key={error} className="flex gap-2 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle size={16} />{error}</p>)}{plan.warnings.map(warning => <p key={warning} className="rounded bg-paper p-3 text-sm">{warning}</p>)}</div>}
      <div className="mt-4 grid gap-2">{plan.rows.flatMap(row => row.explanations.map((explanation, index) => ({ ...explanation, id: `${row.id}-${index}` }))).concat(plan.solventExplanation ? [{ ...plan.solventExplanation, id: "solvent" }] : []).map(explanation => <div key={explanation.id} className="rounded border border-ink/10 bg-white"><button onClick={() => setOpenExplanation(openExplanation === explanation.id ? null : explanation.id)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"><span className="inline-flex items-center gap-2"><BookOpenCheck size={15} />{explanation.label}</span><ChevronDown size={15} /></button>{openExplanation === explanation.id && <div className="border-t border-ink/10 bg-paper px-4 py-3 text-sm"><p><strong>Formula:</strong> {explanation.formula}</p><p className="mt-1"><strong>Substituted:</strong> {explanation.substituted}</p><p className="mt-1 font-semibold text-copper">{explanation.result} — Calculated by BindLab</p></div>}</div>)}</div>
    </section>
  );
}
