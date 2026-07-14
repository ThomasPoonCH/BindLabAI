"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Beaker, Clipboard, Download, FileText, FlaskConical, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import {
  calculateUniversalPlan,
  makeUniversalProtocol,
  type AnalysisType,
  type CalculationMode,
  type LimitingInputMode,
  type PhysicalForm,
  type UniversalExperiment,
  type UniversalReagent,
  type UniversalRole
} from "@/lib/calculators/universal-reaction";

type StartChoice = "choose" | "blank" | "template" | "sample";
type WorkspaceStep = "setup" | "reagents" | "solvents" | "checks" | "analysis" | "protocol" | "save";

const roles: UniversalRole[] = ["reactant", "reagent", "catalyst", "base", "acid", "ligand", "additive", "solvent", "quench", "other"];
const forms: PhysicalForm[] = ["solid", "liquid", "stock solution", "gas", "unknown"];
const calcModes: CalculationMode[] = ["equivalents", "manual", "informational"];
const inputModes: { value: LimitingInputMode; label: string }[] = [
  { value: "mass", label: "Mass + MW" },
  { value: "mmol", label: "mmol directly" },
  { value: "volume", label: "Volume + density + MW" },
  { value: "stock", label: "Stock solution" }
];

const blankExperiment = (): UniversalExperiment => ({
  name: "",
  category: "",
  targetProductName: "",
  limitingName: "",
  limitingInputMode: "mass",
  limitingMw: undefined,
  limitingMassMg: undefined,
  limitingMmol: undefined,
  limitingVolumeMl: undefined,
  limitingDensity: undefined,
  limitingStockConcentration: undefined,
  desiredConcentration: undefined,
  temperature: "",
  time: "",
  atmosphere: "",
  notes: "",
  reagents: [],
  solvents: [],
  makeTotalVolume: false,
  analysis: "none",
  analysisCustom: "",
  productMw: undefined,
  lcmsSampleVolumeUl: undefined,
  lcmsFinalVolumeUl: undefined
});

const templates: { id: string; title: string; copy: string; get: () => UniversalExperiment }[] = [
  { id: "general", title: "General reaction planning", copy: "A neutral structure for any synthesis or transformation.", get: () => ({ ...blankExperiment(), category: "General reaction" }) },
  { id: "amide", title: "Amide / peptide coupling", copy: "A neutral coupling scaffold with no reaction-specific reagents prefilled.", get: () => ({ ...blankExperiment(), category: "Amide / peptide coupling" }) },
  { id: "click", title: "Click reaction", copy: "A minimal stock-solution setup for a conjugation-style reaction.", get: () => ({ ...blankExperiment(), category: "Click reaction", limitingName: "Alkyne component", limitingInputMode: "mmol", limitingMmol: 0.05, reagents: [{ id: "azide", name: "Azide component", role: "reactant", form: "stock solution", stockConcentration: 0.01, equivalents: 1.2, calculationMode: "equivalents", notes: "Confirm formulation and solvent compatibility." }], solvents: [{ id: "dmso", name: "DMSO", mode: "percent", value: 10, notes: "" }, { id: "buffer", name: "Buffer", mode: "percent", value: 90, notes: "" }] }) },
  { id: "dilution", title: "Solution dilution / sample preparation", copy: "No reaction assumptions: manual sample amounts and solvent system only.", get: () => ({ ...blankExperiment(), category: "Sample preparation", limitingName: "Sample", limitingInputMode: "mmol", limitingMmol: 0.01, reagents: [{ id: "sample", name: "Sample stock", role: "other", form: "stock solution", calculationMode: "manual", manualAmount: "10 uL", notes: "Enter confirmed sample volume." }], solvents: [{ id: "diluent", name: "Diluent", mode: "volume", value: 0.99, notes: "" }] }) },
  { id: "conjugation", title: "Chemical-biology conjugation", copy: "A neutral protein/small-molecule conjugation planning structure.", get: () => ({ ...blankExperiment(), category: "Chemical-biology conjugation", limitingName: "Small-molecule partner", limitingInputMode: "stock", limitingVolumeMl: 0.05, limitingStockConcentration: 0.002, reagents: [{ id: "bio", name: "Biomolecule partner", role: "reactant", form: "stock solution", stockConcentration: 0.001, equivalents: 1, calculationMode: "equivalents", notes: "Confirm active concentration and buffer compatibility." }], solvents: [{ id: "buffer", name: "Reaction buffer", mode: "volume", value: 0.45, notes: "" }] }) },
  { id: "custom", title: "Blank custom workflow", copy: "A blank workspace without reaction-specific assumptions.", get: blankExperiment }
];

function peptideDemo(): UniversalExperiment {
  return {
    ...blankExperiment(),
    name: "Sample Demo — peptide coupling pilot reaction",
    category: "Amide / peptide coupling",
    targetProductName: "Protected amide product",
    limitingName: "Carboxylic acid substrate",
    limitingInputMode: "mass",
    limitingMw: 411.457,
    limitingMassMg: 65,
    desiredConcentration: 0.1333,
    temperature: "room temperature",
    time: "2 h",
    notes: "Sample Demo — not a default reaction. Monitor by the approved method before workup.",
    solvents: [{ id: "dmf", name: "DMF", mode: "volume", value: 1.1, notes: "Planning estimate" }],
    analysis: "LCMS",
    productMw: 549.62,
    lcmsSampleVolumeUl: 1,
    lcmsFinalVolumeUl: 250,
    reagents: [
      { id: "hatu", name: "HATU", role: "reagent", form: "solid", molecularWeight: 380.23, equivalents: 1.1, calculationMode: "equivalents", notes: "" },
      { id: "dipea", name: "DIPEA", role: "base", form: "liquid", molecularWeight: 129.25, density: 0.742, equivalents: 3, calculationMode: "equivalents", notes: "" },
      { id: "amine", name: "Amine partner", role: "reactant", form: "solid", molecularWeight: 156.18, equivalents: 1.2, calculationMode: "equivalents", notes: "" }
    ]
  };
}

const fmt = (value: number | null | undefined, unit = "") => value === null || value === undefined || !globalThis.Number.isFinite(value) ? "Not calculated" : `${globalThis.Number(value.toPrecision(4)).toString()}${unit ? ` ${unit}` : ""}`;

export function ReactionWorkflow() {
  const [choice, setChoice] = useState<StartChoice>("choose");
  const [step, setStep] = useState<WorkspaceStep>("setup");
  const [experiment, setExperiment] = useState<UniversalExperiment>(blankExperiment);
  const [protocolOverride, setProtocolOverride] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scaleFactor, setScaleFactor] = useState(2);

  const plan = useMemo(() => calculateUniversalPlan(experiment), [experiment]);
  const protocol = protocolOverride ?? makeUniversalProtocol(experiment, plan);
  const steps: { id: WorkspaceStep; label: string }[] = [
    { id: "setup", label: "Setup" }, { id: "reagents", label: "Reagents" }, { id: "solvents", label: "Solvent system" }, { id: "checks", label: "Checks" },
    ...(experiment.analysis !== "none" ? [{ id: "analysis" as WorkspaceStep, label: "Analysis plan" }] : []),
    { id: "protocol", label: "Protocol draft" }, { id: "save", label: "Save & Export" }
  ];

  function start(kind: Exclude<StartChoice, "choose">, input?: UniversalExperiment) {
    setChoice(kind); setExperiment(input ?? blankExperiment()); setStep("setup"); setProtocolOverride(null); setNotice(null);
  }
  function update<K extends keyof UniversalExperiment>(key: K, value: UniversalExperiment[K]) { setExperiment((current) => ({ ...current, [key]: value })); setProtocolOverride(null); setNotice(null); }
  function updateReagent(id: string, key: keyof UniversalReagent, value: string | number | undefined) { setExperiment((current) => ({ ...current, reagents: current.reagents.map((row) => row.id === id ? { ...row, [key]: value } : row) })); setProtocolOverride(null); }
  function addReagent() { update("reagents", [...experiment.reagents, { id: crypto.randomUUID(), name: "", role: "reagent", form: "unknown", calculationMode: "informational", notes: "" }]); }
  function duplicateReagent(id: string) { const row = experiment.reagents.find((item) => item.id === id); if (row) update("reagents", [...experiment.reagents, { ...row, id: crypto.randomUUID(), name: row.name ? `${row.name} copy` : "" }]); }
  function moveReagent(id: string, direction: -1 | 1) { const index = experiment.reagents.findIndex((item) => item.id === id); const next = index + direction; if (next < 0 || next >= experiment.reagents.length) return; const rows = [...experiment.reagents]; [rows[index], rows[next]] = [rows[next], rows[index]]; update("reagents", rows); }
  function removeReagent(id: string) { update("reagents", experiment.reagents.filter((item) => item.id !== id)); }
  function addSolvent() { update("solvents", [...experiment.solvents, { id: crypto.randomUUID(), name: "", mode: "volume", value: undefined, notes: "" }]); }
  function updateSolvent(id: string, key: "name" | "mode" | "value" | "notes", value: string | number | undefined) { update("solvents", experiment.solvents.map((row) => row.id === id ? { ...row, [key]: value } : row)); }
  function removeSolvent(id: string) { update("solvents", experiment.solvents.filter((item) => item.id !== id)); }
  function save(key: "bindlab-experiments" | "bindlab-workflow-templates", label: string) { const existing = JSON.parse(localStorage.getItem(key) ?? "[]"); localStorage.setItem(key, JSON.stringify([{ id: crypto.randomUUID(), title: experiment.name || "Untitled experiment", createdAt: new Date().toISOString(), workspace: experiment, plan, protocol, localOnly: true }, ...existing])); setNotice(`${label} saved in this browser only.`); }
  function duplicateAndScale() { const scaled = { ...experiment, name: `${experiment.name || "Untitled experiment"} — scaled ${scaleFactor}x`, limitingMassMg: experiment.limitingMassMg ? experiment.limitingMassMg * scaleFactor : undefined, limitingMmol: experiment.limitingMmol ? experiment.limitingMmol * scaleFactor : undefined, limitingVolumeMl: experiment.limitingVolumeMl ? experiment.limitingVolumeMl * scaleFactor : undefined, reagents: experiment.reagents.map((row) => row.calculationMode === "manual" ? row : { ...row }) }; setExperiment(scaled); setProtocolOverride(null); setStep("setup"); setNotice(`Created a ${scaleFactor}x local draft. Review every calculated and manual value before use.`); }

  if (choice === "choose") return <StartChoice onBlank={() => start("blank")} onSample={() => start("sample", peptideDemo())} onTemplate={(template) => start("template", template.get())} />;

  return <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
    <aside className="h-fit rounded-md border border-ink/10 bg-white p-4 shadow-sm lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">{choice === "sample" ? "Sample Demo — not a default reaction" : "Universal planning workspace"}</p>
      <div className="mt-4 grid gap-1.5">{steps.map((item, index) => <button key={item.id} type="button" onClick={() => setStep(item.id)} className={`rounded-md px-3 py-3 text-left text-sm font-semibold transition ${step === item.id ? "bg-ink text-paper" : "text-ink/70 hover:bg-mint/45"}`}><span className="mr-2 text-xs opacity-65">{index + 1}</span>{item.label}</button>)}</div>
      <div className="mt-5 rounded-md bg-mint/45 p-3 text-sm leading-6 text-ink/72"><p className="font-semibold text-moss">Live plan</p><p>{fmt(plan.limitingMmol, "mmol")} limiting reagent</p><p>{plan.totalVolumeMl === null ? "No total-volume calculation" : `${fmt(plan.totalVolumeMl, "mL")} total volume`}</p></div>
      <button type="button" onClick={() => setChoice("choose")} className="mt-4 w-full rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold text-ink/70">Choose another start</button>
    </aside>
    <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
      {step === "setup" && <Setup experiment={experiment} update={update} />}
      {step === "reagents" && <Reagents experiment={experiment} plan={plan} update={updateReagent} add={addReagent} duplicate={duplicateReagent} remove={removeReagent} move={moveReagent} />}
      {step === "solvents" && <Solvents experiment={experiment} plan={plan} update={update} add={addSolvent} updateSolvent={updateSolvent} remove={removeSolvent} />}
      {step === "checks" && <Checks plan={plan} />}
      {step === "analysis" && <Analysis experiment={experiment} update={update} />}
      {step === "protocol" && <Protocol value={protocol} onChange={setProtocolOverride} />}
      {step === "save" && <SaveExport experiment={experiment} plan={plan} protocol={protocol} notice={notice} save={save} scaleFactor={scaleFactor} setScaleFactor={setScaleFactor} duplicateAndScale={duplicateAndScale} />}
    </section>
  </div>;
}

function StartChoice({ onBlank, onSample, onTemplate }: { onBlank: () => void; onSample: () => void; onTemplate: (template: typeof templates[number]) => void }) { return <section className="mx-auto max-w-5xl"><div className="rounded-md border border-ink/10 bg-white p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">New Experiment</p><h2 className="mt-2 text-3xl font-semibold">How would you like to begin?</h2><p className="mt-3 max-w-3xl leading-7 text-ink/68">Start with a neutral workspace for any chemistry or chemical-biology plan, use an optional workflow template, or open the competition demo.</p><div className="mt-7 grid gap-4 md:grid-cols-2"><ChoiceCard icon={<FlaskConical size={22} />} title="Start a blank experiment" copy="An empty universal workspace with neutral examples only. No HATU, DIPEA, peptide coupling, DMF, LCMS, or fixed concentration." action="Start blank" onClick={onBlank} /><ChoiceCard icon={<Sparkles size={22} />} title="Open a Sample Demo" copy="The existing peptide-coupling workflow, clearly labeled Sample Demo — not a default reaction." action="Open demo" onClick={onSample} /></div></div><div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">Optional workflow templates</p><div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{templates.map((template) => <ChoiceCard key={template.id} icon={<Beaker size={19} />} title={template.title} copy={template.copy} action="Use template" onClick={() => onTemplate(template)} />)}</div></div></section>; }
function ChoiceCard({ icon, title, copy, action, onClick }: { icon: React.ReactNode; title: string; copy: string; action: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="rounded-md border border-ink/10 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-moss/40"><span className="grid h-10 w-10 place-items-center rounded-md bg-mint text-moss">{icon}</span><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-ink/65">{copy}</p><span className="mt-4 inline-flex text-sm font-semibold text-moss">{action} →</span></button>; }

function Setup({ experiment, update }: { experiment: UniversalExperiment; update: <K extends keyof UniversalExperiment>(key: K, value: UniversalExperiment[K]) => void }) { return <><Heading title="Experiment setup" copy="Only enter the information relevant to this experiment. Blank optional fields remain blank; BindLab will never invent chemical data." /><div className="grid gap-4 md:grid-cols-2"><Text label="Experiment name" value={experiment.name} placeholder="e.g., Suzuki coupling, amide coupling, oxidation, click reaction" onChange={(value) => update("name", value)} /><Text label="Reaction type / category (optional)" value={experiment.category} placeholder="e.g., cross-coupling" onChange={(value) => update("category", value)} /><Text label="Target product name (optional)" value={experiment.targetProductName} onChange={(value) => update("targetProductName", value)} /><Text label="Limiting reagent name" value={experiment.limitingName} placeholder="e.g., aryl bromide" onChange={(value) => update("limitingName", value)} /><Select label="Limiting reagent input" value={experiment.limitingInputMode} options={inputModes.map((item) => [item.value, item.label])} onChange={(value) => update("limitingInputMode", value as LimitingInputMode)} />{experiment.limitingInputMode === "mass" && <><NumberField label="Mass (mg)" value={experiment.limitingMassMg} onChange={(value) => update("limitingMassMg", value)} /><NumberField label="MW (g/mol)" value={experiment.limitingMw} onChange={(value) => update("limitingMw", value)} /></>}{experiment.limitingInputMode === "mmol" && <NumberField label="Amount (mmol)" value={experiment.limitingMmol} onChange={(value) => update("limitingMmol", value)} />}{experiment.limitingInputMode === "volume" && <><NumberField label="Volume (mL)" value={experiment.limitingVolumeMl} onChange={(value) => update("limitingVolumeMl", value)} /><NumberField label="Density (g/mL)" value={experiment.limitingDensity} onChange={(value) => update("limitingDensity", value)} /><NumberField label="MW (g/mol)" value={experiment.limitingMw} onChange={(value) => update("limitingMw", value)} /></>}{experiment.limitingInputMode === "stock" && <><NumberField label="Stock volume (mL)" value={experiment.limitingVolumeMl} onChange={(value) => update("limitingVolumeMl", value)} /><NumberField label="Stock concentration (M)" value={experiment.limitingStockConcentration} onChange={(value) => update("limitingStockConcentration", value)} /></>}<NumberField label="Desired concentration (M, optional)" value={experiment.desiredConcentration} onChange={(value) => update("desiredConcentration", value)} /><Text label="Temperature (optional)" value={experiment.temperature} placeholder="e.g., room temperature" onChange={(value) => update("temperature", value)} /><Text label="Time (optional)" value={experiment.time} placeholder="e.g., 2 h" onChange={(value) => update("time", value)} /><Text label="Atmosphere / handling notes (optional)" value={experiment.atmosphere} placeholder="e.g., nitrogen; protect from light" onChange={(value) => update("atmosphere", value)} /><Select label="Analysis plan (optional)" value={experiment.analysis} options={[["none", "None"], ["LCMS", "LCMS"], ["HPLC", "HPLC"], ["NMR", "NMR"], ["custom", "Custom"]]} onChange={(value) => update("analysis", value as AnalysisType)} /></div><label className="mt-4 grid gap-1.5"><Label>General experiment notes</Label><textarea value={experiment.notes} onChange={(event) => update("notes", event.target.value)} rows={4} className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-moss" /></label></>; }

function Reagents({ experiment, plan, update, add, duplicate, remove, move }: { experiment: UniversalExperiment; plan: ReturnType<typeof calculateUniversalPlan>; update: (id: string, key: keyof UniversalReagent, value: string | number | undefined) => void; add: () => void; duplicate: (id: string) => void; remove: (id: string) => void; move: (id: string, dir: -1 | 1) => void }) { return <><Heading title="Dynamic reagent table" copy="Add, remove, duplicate, or reorder unlimited rows. Each row can calculate from equivalents, accept a manual amount, or remain informational." /><button type="button" onClick={add} className="mb-4 inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper"><Plus size={16} />Add reagent</button><div className="overflow-x-auto"><table className="w-full min-w-[1400px] border-separate border-spacing-y-2 text-sm"><thead className="text-left text-xs uppercase tracking-wide text-ink/55"><tr>{["Reagent", "Role", "Form", "Mode", "MW", "Equiv.", "mmol", "Density", "Stock M", "Manual amount", "Calculated amount", "Notes", ""].map((label) => <th key={label} className="px-2">{label}</th>)}</tr></thead><tbody>{experiment.reagents.map((row) => { const result = plan.reagents.find((item) => item.id === row.id); return <tr key={row.id} className="bg-paper/70"><td className="px-2 py-2"><input value={row.name} placeholder="Reagent name" onChange={(e) => update(row.id, "name", e.target.value)} className="w-40 rounded-md border border-ink/15 bg-white px-2 py-2" /></td><td className="px-2 py-2"><InlineSelect value={row.role} values={roles} onChange={(value) => update(row.id, "role", value)} /></td><td className="px-2 py-2"><InlineSelect value={row.form} values={forms} onChange={(value) => update(row.id, "form", value)} /></td><td className="px-2 py-2"><InlineSelect value={row.calculationMode} values={calcModes} onChange={(value) => update(row.id, "calculationMode", value)} /></td><td className="px-2 py-2"><Mini value={row.molecularWeight} onChange={(value) => update(row.id, "molecularWeight", value)} /></td><td className="px-2 py-2"><Mini value={row.equivalents} onChange={(value) => update(row.id, "equivalents", value)} /></td><td className="px-2 py-2 font-semibold">{fmt(result?.calculatedMmol, "mmol")}</td><td className="px-2 py-2"><Mini value={row.density} onChange={(value) => update(row.id, "density", value)} /></td><td className="px-2 py-2"><Mini value={row.stockConcentration} onChange={(value) => update(row.id, "stockConcentration", value)} /></td><td className="px-2 py-2"><input value={row.manualAmount ?? ""} placeholder="e.g., 10 uL" onChange={(e) => update(row.id, "manualAmount", e.target.value)} className="w-28 rounded-md border border-ink/15 bg-white px-2 py-2" /></td><td className="px-2 py-2 font-semibold text-ink">{result?.amount ?? "-"}</td><td className="px-2 py-2"><input value={row.notes} onChange={(e) => update(row.id, "notes", e.target.value)} className="w-40 rounded-md border border-ink/15 bg-white px-2 py-2" /></td><td className="px-2 py-2"><div className="flex gap-1"><IconButton label="Move up" onClick={() => move(row.id, -1)}><ArrowUp size={14} /></IconButton><IconButton label="Move down" onClick={() => move(row.id, 1)}><ArrowDown size={14} /></IconButton><IconButton label="Duplicate" onClick={() => duplicate(row.id)}><Clipboard size={14} /></IconButton><IconButton label="Remove" onClick={() => remove(row.id)}><Trash2 size={14} /></IconButton></div></td></tr>; })}</tbody></table></div>{!experiment.reagents.length && <p className="rounded-md border border-dashed border-ink/20 p-5 text-sm text-ink/62">No reagents yet. Add a row only when your plan requires one.</p>}</>; }

function Solvents({ experiment, plan, update, add, updateSolvent, remove }: { experiment: UniversalExperiment; plan: ReturnType<typeof calculateUniversalPlan>; update: <K extends keyof UniversalExperiment>(key: K, value: UniversalExperiment[K]) => void; add: () => void; updateSolvent: (id: string, key: "name" | "mode" | "value" | "notes", value: string | number | undefined) => void; remove: (id: string) => void }) { return <><Heading title="Solvent system" copy="Use one solvent or a mixed system such as ACN:H2O = 4:6. Volumes can be entered manually; percentage components can use a calculated total volume." /><label className="mb-5 flex items-center gap-3 rounded-md bg-mint/35 p-4 text-sm font-semibold"><input type="checkbox" checked={experiment.makeTotalVolume} onChange={(e) => update("makeTotalVolume", e.target.checked)} />Make total reaction volume from limiting reagent and desired concentration</label><button type="button" onClick={add} className="mb-4 inline-flex items-center gap-2 rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold"><Plus size={16} />Add solvent</button><div className="grid gap-3">{experiment.solvents.map((solvent) => <div key={solvent.id} className="grid gap-3 rounded-md border border-ink/10 bg-paper p-3 md:grid-cols-[1.5fr_160px_150px_1fr_auto]"><input value={solvent.name} placeholder="Solvent name, e.g., ACN" onChange={(e) => updateSolvent(solvent.id, "name", e.target.value)} className="rounded-md border border-ink/15 bg-white px-3 py-2" /><InlineSelect value={solvent.mode} values={["volume", "percent"]} onChange={(value) => updateSolvent(solvent.id, "mode", value)} /><Mini value={solvent.value} onChange={(value) => updateSolvent(solvent.id, "value", value)} /><input value={solvent.notes} placeholder="Optional note" onChange={(e) => updateSolvent(solvent.id, "notes", e.target.value)} className="rounded-md border border-ink/15 bg-white px-3 py-2" /><IconButton label="Remove solvent" onClick={() => remove(solvent.id)}><Trash2 size={15} /></IconButton></div>)}</div><div className="mt-5 rounded-md bg-paper p-4 text-sm leading-6 text-ink/70"><p className="font-semibold text-ink">Solvent plan</p><p className="mt-1">{plan.solventSummary}</p><p className="mt-1">{experiment.makeTotalVolume ? `Calculated total reaction volume: ${fmt(plan.totalVolumeMl, "mL")}` : "Solvent volumes are entered manually."}</p></div></>; }

function Checks({ plan }: { plan: ReturnType<typeof calculateUniversalPlan> }) { const status = plan.missing.length ? "Missing information" : plan.review.length ? "Needs review" : "Passed"; return <><Heading title="Checks" copy="These deterministic checks identify incomplete inputs and planning assumptions. They do not approve a reaction or replace researcher/supervisor review." /><div className={`rounded-md border p-5 ${status === "Passed" ? "border-moss/30 bg-mint/45" : status === "Needs review" ? "border-amber-300 bg-amber-50" : "border-red-200 bg-red-50"}`}><p className="text-xs font-semibold uppercase tracking-[0.16em]">Calculation status</p><p className="mt-1 text-2xl font-semibold">{status}</p></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Issue title="Missing information" items={plan.missing} empty="No required calculation fields are missing." /><Issue title="Needs review" items={plan.review} empty="No general review flags." warning /></div><div className="mt-5 rounded-md bg-paper p-4 text-sm leading-6 text-ink/70"><p className="font-semibold">Calculation assumptions</p><ul className="mt-2 grid gap-1">{plan.assumptions.map((item) => <li key={item}>• {item}</li>)}</ul></div></>; }

function Analysis({ experiment, update }: { experiment: UniversalExperiment; update: <K extends keyof UniversalExperiment>(key: K, value: UniversalExperiment[K]) => void }) { return <><Heading title="Analysis plan" copy="Analysis is optional. BindLab shows LCMS preparation only when LCMS is selected; it does not imply every reaction requires LCMS." />{experiment.analysis === "LCMS" ? <div className="grid gap-4 md:grid-cols-2"><NumberField label="Neutral product MW (g/mol)" value={experiment.productMw} onChange={(value) => update("productMw", value)} /><NumberField label="Crude sample volume (uL)" value={experiment.lcmsSampleVolumeUl} onChange={(value) => update("lcmsSampleVolumeUl", value)} /><NumberField label="Final LCMS sample volume (uL)" value={experiment.lcmsFinalVolumeUl} onChange={(value) => update("lcmsFinalVolumeUl", value)} /><div className="rounded-md bg-paper p-4 text-sm leading-6 text-ink/70">Sample preparation is a deterministic dilution plan. Confirm injection solvent, method, column, and instrument conditions separately.</div></div> : experiment.analysis === "custom" ? <Text label="Custom analysis plan" value={experiment.analysisCustom} placeholder="e.g., UV-vis after purification" onChange={(value) => update("analysisCustom", value)} /> : <div className="rounded-md bg-paper p-5 text-sm leading-6 text-ink/70">Selected analysis: <strong>{experiment.analysis}</strong>. Add method-specific fields only when they are relevant.</div>}</>; }

function Protocol({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <><Heading title="Protocol draft" copy="A neutral, editable draft built from your entered plan. It does not generate conditions or invent reaction details." /><div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="mr-2 inline-block" size={16} />Draft protocol — verify against approved source material, SDS, and supervisor instructions.</div><textarea value={value} onChange={(e) => onChange(e.target.value)} rows={20} className="mt-5 w-full rounded-md border border-ink/15 bg-paper p-4 font-mono text-sm leading-6 outline-none focus:border-moss" /></>; }

function SaveExport({ experiment, plan, protocol, notice, save, scaleFactor, setScaleFactor, duplicateAndScale }: { experiment: UniversalExperiment; plan: ReturnType<typeof calculateUniversalPlan>; protocol: string; notice: string | null; save: (key: "bindlab-experiments" | "bindlab-workflow-templates", label: string) => void; scaleFactor: number; setScaleFactor: (value: number) => void; duplicateAndScale: () => void }) { const csv = [["Reagent", "Role", "Form", "Amount", "Notes"], ...plan.reagents.map((row) => [row.name, row.role, row.form, row.amount, row.notes])].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n"); return <><Heading title="Save & Export" copy="Save locally for this demo, reuse a workflow as a template, or create a scaled local draft. Secure multi-user records need a backend." /><div className="rounded-md border border-copper/20 bg-copper/5 p-4 text-sm leading-6 text-ink/72"><strong className="text-copper">Demo / local record</strong><br />Data is saved only in this browser. It is not a secure lab record or shared ELN.</div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => save("bindlab-experiments", "Experiment record")} className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 font-semibold text-paper"><Save size={16} />Save local record</button><button type="button" onClick={() => save("bindlab-workflow-templates", "Workflow template")} className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-2.5 font-semibold"><Sparkles size={16} />Save as my template</button><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`${(experiment.name || "experiment").replaceAll(" ", "-").toLowerCase()}-reagents.csv`} className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-2.5 font-semibold"><Download size={16} />Export CSV</a><button type="button" onClick={() => navigator.clipboard.writeText(protocol)} className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-2.5 font-semibold"><Clipboard size={16} />Copy protocol</button></div><div className="mt-6 rounded-md border border-ink/10 bg-paper p-4"><p className="font-semibold">Duplicate and scale</p><p className="mt-1 text-sm text-ink/65">Creates a local draft with the limiting input scaled. Equivalents remain unchanged; manual amounts require review.</p><div className="mt-3 flex flex-wrap items-center gap-3"><input type="number" min="0.1" step="0.1" value={scaleFactor} onChange={(e) => setScaleFactor(Number(e.target.value))} className="w-24 rounded-md border border-ink/15 bg-white px-3 py-2" /><span className="text-sm font-semibold">× scale</span><button type="button" onClick={duplicateAndScale} className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold">Duplicate and scale</button></div></div>{notice && <p className="mt-4 rounded-md bg-mint px-4 py-3 text-sm font-semibold text-moss">{notice}</p>}</>; }

function Heading({ title, copy }: { title: string; copy: string }) { return <div className="mb-6 flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-mint text-moss"><FlaskConical size={19} /></span><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 max-w-3xl leading-6 text-ink/65">{copy}</p></div></div>; }
function Label({ children }: { children: React.ReactNode }) { return <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/58">{children}</span>; }
function Text({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5"><Label>{label}</Label><input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-moss" /></label>; }
function NumberField({ label, value, onChange }: { label: string; value?: number; onChange: (value: number | undefined) => void }) { return <label className="grid gap-1.5"><Label>{label}</Label><input type="number" step="any" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-moss" /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) { return <label className="grid gap-1.5"><Label>{label}</Label><select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-ink/15 bg-white px-3 py-2 outline-none focus:border-moss">{options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>; }
function InlineSelect({ value, values, onChange }: { value: string; values: string[]; onChange: (value: string) => void }) { return <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-md border border-ink/15 bg-white px-2 py-2 text-xs">{values.map((item) => <option key={item}>{item}</option>)}</select>; }
function Mini({ value, onChange }: { value?: number; onChange: (value: number | undefined) => void }) { return <input type="number" step="any" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} className="w-24 rounded-md border border-ink/15 bg-white px-2 py-2" />; }
function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-label={label} title={label} onClick={onClick} className="rounded-md border border-ink/15 bg-white p-2 text-ink/65 hover:text-ink">{children}</button>; }
function Issue({ title, items, empty, warning = false }: { title: string; items: string[]; empty: string; warning?: boolean }) { return <div className={`rounded-md border p-4 ${warning ? "border-amber-200 bg-amber-50" : "border-ink/10 bg-paper"}`}><p className="font-semibold">{title}</p><div className="mt-3 grid gap-2 text-sm leading-6 text-ink/72">{(items.length ? items : [empty]).map((item) => <p key={item}>• {item}</p>)}</div></div>; }
