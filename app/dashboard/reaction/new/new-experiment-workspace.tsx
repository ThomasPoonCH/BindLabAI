"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { AiBuilder } from "./ai-builder";
import { ExperimentCalculatorTable } from "./experiment-calculator-table";
import type { ExperimentRecord } from "@/lib/ai/experiment-schema";
import { theoreticalProduct } from "@/lib/chemistry/experiment-calculations";
import { resolveExperimentReagents } from "@/lib/chemistry/reagent-resolution";
import { saveExperiment } from "@/lib/experiment-repository";
import { blockingReasons, findConflicts, mergeDraft, type Resolution } from "@/lib/experiment-workflow";
import styles from "./experiment-workspace.module.css";

const timestamp = () => new Date().toISOString();
const provenance = (sourceType: "user_entered" | "suggested_by_ai" = "user_entered") => ({ sourceType, sourceText: null, sourceReference: null, confidence: null, confirmedByUser: sourceType === "user_entered", createdAt: timestamp(), updatedAt: timestamp() });
const input = "w-full min-w-0 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/15";
const splitList = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean);
const friendlyReason = (reason: string) => reason.includes("MW unavailable") || reason.includes("molecular weight") ? "Enter or confirm the molecular weight to calculate the required mass." : reason.includes("density") ? "Mass can be calculated, but liquid volume requires density." : reason.includes("stock concentration") ? "Enter the stock concentration to calculate how much solution to pipette." : reason.includes("limiting reagent") || reason.includes("reference reagent") ? "Choose the reagent that sets the reaction scale." : reason;

export function blankExperiment(): ExperimentRecord {
  const now = timestamp();
  return { experimentId: crypto.randomUUID(), title: null, objective: null, reactionType: null, experimentStatus: "draft", createdAt: now, updatedAt: now, originalInstruction: "", reagents: [], conditions: { solvent: null, solventVolume: null, solventVolumeUnit: "mL", targetConcentration: null, targetConcentrationUnit: "M", temperature: null, temperatureUnit: "C", duration: null, durationUnit: "h", atmosphere: null, vessel: null, vesselCapacity: null, vesselCapacityUnit: "mL", mixingMethod: null, orderOfAddition: [], provenance: provenance() }, workup: null, purification: null, analyticalMethods: [], expectedProduct: null, expectedMolecularWeight: null, productStoichiometry: null, expectedLcmsIons: [], actualIsolatedMassMg: null, actualYieldPercent: null, notes: null, safetyNotes: [], missingInformation: [], conflicts: [], assumptions: [], warnings: [], aiSummary: null };
}

function fixtureReagent(name: string, role: string, equivalents: number | null, reference = false): ExperimentRecord["reagents"][number] {
  return { id: crypto.randomUUID(), name, role, physicalState: "unknown", molecularWeight: null, molecularWeightUnit: "g/mol", mass: null, massUnit: "mg", amountMmol: null, equivalents, density: null, densityUnit: "g/mL", stockConcentration: null, stockConcentrationUnit: "M", volume: null, volumeUnit: null, isLimitingReagent: reference, inputValue: null, inputUnit: "mg", purityPercent: null, propertyVerificationStatus: "unresolved", provenance: provenance("suggested_by_ai") };
}

export function demoDraft(): ExperimentRecord {
  const draft = blankExperiment();
  const substrate = { ...fixtureReagent("12-COOH stereoisomer substrate", "reactant", 1, true), molecularWeight: 411.457, inputValue: 70, propertySource: "User-confirmed fixture value", propertyVerificationStatus: "user_confirmed" as const };
  return resolveExperimentReagents({ ...draft, title: "Sample 12-NHMe amide coupling", objective: "Plan the fixture reaction represented in ownJUL15.xlsx.", reactionType: "Amide coupling", originalInstruction: "Sample Demo — fixture values require researcher confirmation.", reagents: [substrate, fixtureReagent("HATU", "reagent", 1.2), fixtureReagent("DIPEA", "base", 4), fixtureReagent("Methylamine hydrochloride", "reagent", 1.5), fixtureReagent("DMF", "solvent", null)], conditions: { ...draft.conditions, solvent: "DMF", targetConcentration: 0.133333333333333, provenance: provenance("suggested_by_ai") }, expectedProduct: "Expected 12-NHMe stereoisomer product", expectedMolecularWeight: 424.5, productStoichiometry: 1, warnings: ["Sample fixture only. Confirm exact substrate identity, stereochemistry, and addition order."], aiSummary: "Development fixture based on ownJUL15.xlsx." });
}

function prepareDraftForWorkspace(draft: ExperimentRecord) {
  const product = draft.reagents.find(row => row.role?.toLowerCase() === "product" || /^expected\s/i.test(row.name ?? ""));
  const reagents = draft.reagents.filter(row => row !== product).map(row => ({
    ...row,
    inputValue: row.inputValue ?? (row.mass !== null ? row.mass : row.amountMmol !== null ? row.amountMmol : row.volume),
    inputUnit: row.inputUnit ?? (row.mass !== null ? row.massUnit : row.amountMmol !== null ? "mmol" : row.volume !== null ? row.volumeUnit : null),
  }));
  return resolveExperimentReagents({ ...draft, reagents, expectedProduct: draft.expectedProduct ?? product?.name ?? null, expectedMolecularWeight: draft.expectedMolecularWeight ?? null });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1 text-sm font-medium text-ink/80"><span>{label}</span>{children}</label>; }

export function NewExperimentWorkspace({ initial }: { initial?: ExperimentRecord }) {
  const [record, setRecord] = useState<ExperimentRecord>(() => initial ? resolveExperimentReagents(initial) : blankExperiment());
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [draft, setDraft] = useState<ExperimentRecord | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [notice, setNotice] = useState("");
  const router = useRouter();
  const conflicts = useMemo(() => draft ? findConflicts(record, draft) : [], [record, draft]);
  const blockers = useMemo(() => blockingReasons(record), [record]);
  const product = useMemo(() => theoreticalProduct(record), [record]);
  const update = (patch: Partial<ExperimentRecord>) => setRecord(current => ({ ...current, ...patch, updatedAt: timestamp() }));
  const updateConditions = (patch: Partial<ExperimentRecord["conditions"]>) => update({ conditions: { ...record.conditions, ...patch, provenance: provenance() } });
  const apply = () => {
    if (!draft) return;
    if (conflicts.some(conflict => !resolutions[conflict.field])) return setNotice("Choose a resolution for every material conflict before applying.");
    setRecord(prepareDraftForWorkspace({ ...mergeDraft(record, draft, resolutions), conflicts: [] }));
    setDraft(null); setResolutions({}); setMode("manual");
    setNotice("Draft applied. Confirm the reference reagent and all unresolved properties before saving.");
  };
  const save = () => {
    if (blockers.length) return setNotice("Save is blocked until the listed review items are addressed.");
    const saved = saveExperiment({ ...record, experimentStatus: "ready_to_run" });
    router.push(`/dashboard/experiments/${saved.experimentId}`);
  };

  return <div className={`${styles.workspace} grid gap-6`}>
    <div className="flex flex-wrap gap-2"><button onClick={() => setMode("manual")} className={`rounded-md px-4 py-2 text-sm font-semibold ${mode === "manual" ? "bg-ink text-paper" : "border border-ink/15 bg-white"}`}>Build manually</button><button onClick={() => setMode("ai")} className={`rounded-md px-4 py-2 text-sm font-semibold ${mode === "ai" ? "bg-ink text-paper" : "border border-ink/15 bg-white"}`}>Build with AI</button><button onClick={() => { setDraft(demoDraft()); setMode("ai"); }} className="rounded-md border border-copper/40 px-4 py-2 text-sm font-semibold text-copper">Load Demo Draft</button></div>
    {mode === "ai" && <AiBuilder onApplyDraft={incoming => { setDraft(prepareDraftForWorkspace(incoming)); setResolutions({}); setNotice("Review extracted evidence before applying it to the calculator."); }} />}
    {draft && <section className="rounded-md border border-copper/30 bg-white p-5 shadow-sm"><h2 className="text-xl font-semibold">Extracted draft review</h2><p className="mt-1 text-sm text-ink/65">Chemical identity suggestions are separate from trusted properties. Nothing is saved here.</p><div className="mt-4 rounded bg-paper p-3 text-sm"><strong>Draft:</strong> {draft.title || "Untitled"}<br /><strong>Extracted rows:</strong> {draft.reagents.map(row => row.name).filter(Boolean).join(", ") || "None"}<br /><strong>Original instruction:</strong> {draft.originalInstruction || "Not supplied"}</div>{conflicts.length > 0 && <div className="mt-4 grid gap-3">{conflicts.map(conflict => <article key={conflict.field} className="rounded border border-copper/25 p-4"><p className="font-semibold capitalize">{conflict.field}</p><p className="mt-1 text-sm text-ink/65">{conflict.reason}</p><div className="mt-3 flex flex-wrap gap-2">{(["keep", "ai", "manual"] as const).map(action => <button key={action} onClick={() => setResolutions(current => ({ ...current, [conflict.field]: action }))} className={`rounded border px-3 py-1.5 text-sm ${resolutions[conflict.field] === action ? "border-ink bg-ink text-paper" : "border-ink/20"}`}>{action === "keep" ? "Keep current" : action === "ai" ? "Use extracted" : "Edit manually"}</button>)}</div></article>)}</div>}<div className="mt-4 flex gap-2"><button onClick={apply} disabled={conflicts.some(conflict => !resolutions[conflict.field])} className="rounded bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40">Apply to Experiment Workspace</button><button onClick={() => setDraft(null)} className="rounded border border-ink/20 px-4 py-2 text-sm">Discard draft</button></div></section>}

    <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Canonical record</p><h1 className="mt-1 text-2xl font-semibold">New Experiment</h1></div><span className="rounded-full bg-paper px-3 py-1 text-xs font-semibold">Demo / local record</span></div>
      <details open className="mt-5 border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold">Experiment overview</summary><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Experiment title"><input className={input} value={record.title ?? ""} onChange={event => update({ title: event.target.value })} /></Field><Field label="Objective"><input className={input} value={record.objective ?? ""} onChange={event => update({ objective: event.target.value })} /></Field><Field label="Reaction type"><input className={input} value={record.reactionType ?? ""} onChange={event => update({ reactionType: event.target.value })} /></Field><Field label="Record status"><select className={input} value={record.experimentStatus} onChange={event => update({ experimentStatus: event.target.value as ExperimentRecord["experimentStatus"] })}><option value="draft">Draft</option><option value="needs_review">Needs review</option><option value="ready_to_run">Ready to run</option></select></Field></div></details>

      <ExperimentCalculatorTable record={record} onChange={setRecord} onNotice={setNotice} />

      <details open className="mt-5 border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold">Solvent system and conditions</summary><div className="mt-4 grid gap-3 md:grid-cols-4"><Field label="Solvent"><input className={input} value={record.conditions.solvent ?? ""} onChange={event => updateConditions({ solvent: event.target.value })} /></Field><Field label="Target concentration"><div className="flex"><input className={input} type="number" min="0" value={record.conditions.targetConcentration ?? ""} onChange={event => updateConditions({ targetConcentration: event.target.value ? Number(event.target.value) : null })} /><select className="border border-l-0 border-ink/15 px-2" value={record.conditions.targetConcentrationUnit} onChange={event => updateConditions({ targetConcentrationUnit: event.target.value as "M" | "mM" | "uM" })}><option>M</option><option>mM</option><option>uM</option></select></div></Field><Field label="Temperature"><input className={input} value={record.conditions.temperature ?? ""} onChange={event => updateConditions({ temperature: event.target.value })} /></Field><Field label="Duration"><input className={input} value={record.conditions.duration ?? ""} onChange={event => updateConditions({ duration: event.target.value })} /></Field><Field label="Atmosphere"><input className={input} value={record.conditions.atmosphere ?? ""} onChange={event => updateConditions({ atmosphere: event.target.value })} /></Field><Field label="Order of addition"><input className={input} value={record.conditions.orderOfAddition.join(", ")} onChange={event => updateConditions({ orderOfAddition: splitList(event.target.value) })} /></Field></div></details>

      <details open className="mt-5 border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold">Expected product — not an addition</summary><div className="mt-4 grid gap-3 md:grid-cols-3"><Field label="Expected product"><input className={input} value={record.expectedProduct ?? ""} onChange={event => update({ expectedProduct: event.target.value })} /></Field><Field label="Confirmed product MW (g/mol)"><input className={input} type="number" min="0" value={record.expectedMolecularWeight ?? ""} onChange={event => update({ expectedMolecularWeight: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="Confirmed stoichiometry"><input className={input} type="number" min="0" step="0.1" placeholder="e.g. 1 for confirmed 1:1" value={record.productStoichiometry ?? ""} onChange={event => update({ productStoichiometry: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="Expected LCMS ions"><input className={input} placeholder="e.g. [M+H]+ 425.5" value={(record.expectedLcmsIons ?? []).join(", ")} onChange={event => update({ expectedLcmsIons: splitList(event.target.value) })} /></Field><Field label="Actual isolated mass (mg)"><input className={input} type="number" min="0" value={record.actualIsolatedMassMg ?? ""} onChange={event => update({ actualIsolatedMassMg: event.target.value ? Number(event.target.value) : null })} /></Field><Field label="Actual yield (%)"><input className={input} type="number" min="0" max="100" value={record.actualYieldPercent ?? ""} onChange={event => update({ actualYieldPercent: event.target.value ? Number(event.target.value) : null })} /></Field></div><div className="mt-3 rounded bg-paper p-3 text-sm">{product ? <>Theoretical maximum: <strong>{product.amountUmol.toPrecision(6)} umol</strong>{product.massMg !== null ? <> / <strong>{product.massMg.toPrecision(6)} mg</strong></> : null}. Calculated only from the confirmed product stoichiometry.</> : "No theoretical product quantity is calculated until reaction stoichiometry is confirmed."}</div></details>

      <details className="mt-5 border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold">Procedure</summary><p className="mt-2 text-sm text-ink/60">Review the extracted or manually entered experimental sequence.</p><div className="mt-4"><Field label="Procedure and notes"><textarea rows={5} className={input} value={record.notes ?? ""} onChange={event => update({ notes: event.target.value })} /></Field></div></details>
      <details className="mt-5 border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold">Work-up and purification</summary><p className="mt-2 text-sm text-ink/60">Keep downstream handling separate from reagent construction.</p><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Work-up"><textarea rows={4} className={input} value={record.workup ?? ""} onChange={event => update({ workup: event.target.value })} /></Field><Field label="Purification"><textarea rows={4} className={input} value={record.purification ?? ""} onChange={event => update({ purification: event.target.value })} /></Field></div></details>
      <details className="mt-5 border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold">Analysis and source instruction</summary><p className="mt-2 text-sm text-ink/60">Record planned analysis and inspect the original source without losing provenance.</p><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Analytical methods"><input className={input} value={record.analyticalMethods.join(", ")} onChange={event => update({ analyticalMethods: splitList(event.target.value) })} /></Field><Field label="Original instruction"><textarea rows={4} className={input} value={record.originalInstruction} onChange={event => update({ originalInstruction: event.target.value })} /></Field></div></details>

      <section className="mt-6 border-t border-ink/10 pt-6"><h2 className="text-lg font-semibold">Review and save</h2><p className="mt-1 text-sm text-ink/60">Resolve required actions, then save the confirmed local experiment record.</p>{blockers.length ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4"><div className="flex gap-2 text-red-800"><AlertTriangle size={18} /><strong>Review required before saving</strong></div><ul className="mt-2 list-disc pl-5 text-sm leading-6 text-red-800">{blockers.map(reason => <li key={reason}>{friendlyReason(reason)}</li>)}</ul></div> : <div className="mt-4 flex gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} />No current blocking issues. Researcher and supervisor review is still required.</div>}<div className="mt-4 rounded-md bg-paper p-3 text-sm leading-6"><strong>Assumptions:</strong> {record.assumptions.join("; ") || "None"}<br /><strong>Warnings:</strong> {record.warnings.join("; ") || "None"}</div><button disabled={blockers.length > 0} onClick={save} className="mt-4 min-h-11 rounded-md bg-ink px-5 py-2.5 font-semibold text-paper transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-40">Save Experiment</button>{notice && <p className="mt-3 rounded-md bg-paper p-3 text-sm text-copper">{notice}</p>}</section>
    </section>
  </div>;
}
