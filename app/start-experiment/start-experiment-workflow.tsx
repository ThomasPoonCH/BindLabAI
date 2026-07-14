"use client";

import Link from "next/link";
import { BindLabLogo } from "@/components/BindLabLogo";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import {
  calculateReactionPlan,
  type ReactionPlanInput,
  type ReactionReagentInput,
  type ReagentRole,
  type ReagentState
} from "@/lib/calculators/reaction";

type WorkflowType = "small-molecule synthesis" | "conjugation" | "other";
type Step = 0 | 1 | 2 | 3 | 4;

type ExperimentForm = ReactionPlanInput & {
  workflowType: WorkflowType;
  targetScaleMg: number;
};

const stepLabels = ["Define", "Plan", "Check", "Execute", "Record"];
const reagentRoles: ReagentRole[] = ["reactant", "coupling reagent", "base", "acid", "additive", "solvent"];
const reagentStates: ReagentState[] = ["solid", "liquid", "solution"];

const sampleReagents: ReactionReagentInput[] = [
  { id: "amine", name: "Amine partner", role: "reactant", molecularWeight: 156.18, equivalents: 1.2, state: "solid" },
  { id: "hatu", name: "HATU", role: "coupling reagent", molecularWeight: 380.23, equivalents: 1.1, state: "solid" },
  { id: "dipea", name: "DIPEA", role: "base", molecularWeight: 129.25, equivalents: 3, density: 0.742, state: "liquid" }
];

function format(value: number | null | undefined, digits = 4) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return Number(value.toPrecision(digits)).toString();
}

function makeProtocol(input: ExperimentForm, solventVolumeMl: number, reagentAmounts: { name: string; displayAmount: string; role: string }[]) {
  return [
    `1. Preparation: Label a clean reaction vessel for ${input.reactionName || "this experiment"}. Review the source procedure, SDS, and local SOP before beginning.`,
    `2. Charge ${format(input.limitingMassMg)} mg of ${input.limitingReagent || "the limiting reagent"} (${format(input.limitingMassMg / input.limitingMolecularWeight)} mmol) to the vessel.`,
    `3. Add approximately ${format(solventVolumeMl)} mL ${input.solvent || "of the selected solvent"}; mix until dissolved or evenly suspended.`,
    ...reagentAmounts.map((reagent, index) => `${index + 4}. Add ${reagent.name} (${reagent.role}): ${reagent.displayAmount}. Confirm the desired order of addition against the approved procedure.`),
    `${reagentAmounts.length + 4}. Maintain ${input.reactionTemperature || "the selected temperature"} for ${input.reactionTime || "the selected reaction time"}. Monitor only by the approved method.`,
    `${reagentAmounts.length + 5}. LCMS preparation: transfer ${format(input.crudeSampleVolumeUl)} uL crude material into the planned LCMS diluent to make ${format(input.lcmsFinalVolumeUl)} uL final sample.`,
    `${reagentAmounts.length + 6}. Documentation: record observations, deviations, batch details, and LCMS notes in this experiment record.`
  ].join("\n\n");
}

export function StartExperimentWorkflow() {
  const [step, setStep] = useState<Step>(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [form, setForm] = useState<ExperimentForm>({
    workflowType: "conjugation",
    targetScaleMg: 65,
    reactionName: "Sample Experiment - amide coupling",
    targetProductName: "Sample protected amide product",
    limitingReagent: "Carboxylic acid substrate",
    limitingMolecularWeight: 411.457,
    limitingMassMg: 65,
    targetConcentrationM: 0.1333,
    solvent: "DMF",
    reactionTemperature: "room temperature",
    reactionTime: "2 h",
    notes: "Sample Experiment only. Confirm all conditions with the approved procedure.",
    productMolecularWeight: 549.62,
    mzTolerance: 0.5,
    crudeSampleVolumeUl: 1,
    lcmsFinalVolumeUl: 250,
    reagents: sampleReagents
  });

  const calculation = useMemo(() => {
    try {
      return { plan: calculateReactionPlan(form), error: null };
    } catch (error) {
      return { plan: null, error: error instanceof Error ? error.message : "The plan could not be calculated." };
    }
  }, [form]);

  const protocolInitial = useMemo(
    () => makeProtocol(form, calculation.plan?.approximateSolventVolumeMl ?? 0, calculation.plan?.reagents ?? []),
    [form, calculation.plan]
  );
  const [protocolOverride, setProtocolOverride] = useState<string | null>(null);
  const protocol = protocolOverride ?? protocolInitial;

  const missing = calculation.plan?.missingData ?? [];
  const warnings = calculation.plan?.warnings ?? [];
  const status = calculation.error || missing.length ? "Missing information" : warnings.length ? "Needs review" : "Passed";

  function update<K extends keyof ExperimentForm>(key: K, value: ExperimentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setSavedAt(null);
  }

  function updateReagent(id: string, key: keyof ReactionReagentInput, value: string | number | undefined) {
    setForm((current) => ({
      ...current,
      reagents: current.reagents.map((reagent) => reagent.id === id ? { ...reagent, [key]: value } : reagent)
    }));
    setSavedAt(null);
  }

  function addReagent() {
    setForm((current) => ({
      ...current,
      reagents: [...current.reagents, {
        id: crypto.randomUUID(),
        name: "New reagent",
        role: "additive",
        molecularWeight: 100,
        equivalents: 1,
        state: "solid"
      }]
    }));
  }

  function removeReagent(id: string) {
    setForm((current) => ({ ...current, reagents: current.reagents.filter((reagent) => reagent.id !== id) }));
    setSavedAt(null);
  }

  function saveRecord() {
    const record = {
      id: crypto.randomUUID(),
      title: form.reactionName,
      workflowType: form.workflowType,
      createdAt: new Date().toISOString(),
      input: form,
      calculated: calculation.plan,
      calculationStatus: status,
      protocol,
      storage: "demo-local-record"
    };
    const existing = JSON.parse(localStorage.getItem("bindlab-experiments") ?? "[]");
    localStorage.setItem("bindlab-experiments", JSON.stringify([record, ...existing]));
    setSavedAt(new Date().toLocaleString());
  }

  function next() {
    setStep((current) => Math.min(current + 1, 4) as Step);
  }

  function previous() {
    setStep((current) => Math.max(current - 1, 0) as Step);
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 bg-white/88 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="BindLab home">
            <BindLabLogo compact />
          </Link>
          <Link href="/dashboard/experiments" className="text-sm font-semibold text-ink/65 transition hover:text-ink">My records</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">BindLab experiment workflow</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Plan a chemical-biology experiment</h1>
            <p className="mt-3 max-w-2xl leading-7 text-ink/68">A structured preparation flow for small-molecule synthesis and conjugation. Calculations are deterministic; protocol text remains editable and requires review.</p>
          </div>
          <span className="rounded-full border border-copper/25 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-copper">Sample Experiment</span>
        </div>

        <nav aria-label="Experiment progress" className="mt-7 grid grid-cols-5 gap-1 border-b border-ink/10 pb-5 sm:gap-3">
          {stepLabels.map((label, index) => {
            const isCurrent = step === index;
            const isComplete = step > index;
            return (
              <button key={label} type="button" onClick={() => setStep(index as Step)} className="group flex min-w-0 flex-col items-center gap-2 text-center">
                <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold transition ${isCurrent ? "bg-ink text-paper" : isComplete ? "bg-mint text-moss" : "bg-ink/8 text-ink/52"}`}>
                  {isComplete ? <CheckCircle2 size={16} /> : index + 1}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-[0.1em] sm:text-xs ${isCurrent ? "text-ink" : "text-ink/52 group-hover:text-ink/75"}`}>{label}</span>
              </button>
            );
          })}
        </nav>

        <section className="mt-7 rounded-md border border-ink/10 bg-white p-5 shadow-soft sm:p-7">
          {step === 0 && <DefineStep form={form} update={update} updateReagent={updateReagent} addReagent={addReagent} removeReagent={removeReagent} />}
          {step === 1 && <PlanStep form={form} calculation={calculation.plan} updateReagent={updateReagent} addReagent={addReagent} removeReagent={removeReagent} />}
          {step === 2 && <CheckStep status={status} error={calculation.error} missing={missing} warnings={warnings} />}
          {step === 3 && <ExecuteStep protocol={protocol} onProtocolChange={setProtocolOverride} />}
          {step === 4 && <RecordStep form={form} status={status} plan={calculation.plan} savedAt={savedAt} onSave={saveRecord} />}

          <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-5">
            <button type="button" onClick={previous} disabled={step === 0} className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-35"><ArrowLeft size={16} />Back</button>
            {step < 4 ? (
              <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper">Continue<ArrowRight size={16} /></button>
            ) : (
              <button type="button" onClick={saveRecord} className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-paper"><Save size={16} />Save local record</button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DefineStep({ form, update, updateReagent, addReagent, removeReagent }: {
  form: ExperimentForm;
  update: <K extends keyof ExperimentForm>(key: K, value: ExperimentForm[K]) => void;
  updateReagent: (id: string, key: keyof ReactionReagentInput, value: string | number | undefined) => void;
  addReagent: () => void;
  removeReagent: (id: string) => void;
}) {
  return <>
    <StepHeading title="Define experiment" description="Enter the objective and starting material. These sample values are editable and are clearly marked as a demonstration." />
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Experiment title" value={form.reactionName} onChange={(value) => update("reactionName", value)} />
      <SelectField label="Workflow type" value={form.workflowType} values={["small-molecule synthesis", "conjugation", "other"]} onChange={(value) => update("workflowType", value as WorkflowType)} />
      <NumberField label="Target scale (mg)" value={form.targetScaleMg} onChange={(value) => update("targetScaleMg", value)} />
      <TextField label="Target product" value={form.targetProductName} onChange={(value) => update("targetProductName", value)} />
      <TextField label="Starting material" value={form.limitingReagent} onChange={(value) => update("limitingReagent", value)} />
      <NumberField label="Starting-material mass (mg)" value={form.limitingMassMg} onChange={(value) => update("limitingMassMg", value)} />
      <NumberField label="Starting-material MW (g/mol)" value={form.limitingMolecularWeight} onChange={(value) => update("limitingMolecularWeight", value)} />
      <NumberField label="Target concentration (M)" value={form.targetConcentrationM} onChange={(value) => update("targetConcentrationM", value)} />
      <TextField label="Solvent" value={form.solvent} onChange={(value) => update("solvent", value)} />
      <TextField label="Target product MW (g/mol)" value={String(form.productMolecularWeight)} onChange={(value) => update("productMolecularWeight", Number(value))} />
    </div>
    <label className="mt-4 grid gap-1.5"><FieldLabel>Optional reaction notes</FieldLabel><textarea rows={4} value={form.notes} onChange={(event) => update("notes", event.target.value)} className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-moss" /></label>
    <ReagentInputTable reagents={form.reagents} updateReagent={updateReagent} addReagent={addReagent} removeReagent={removeReagent} compact />
  </>;
}

function PlanStep({ form, calculation, updateReagent, addReagent, removeReagent }: {
  form: ExperimentForm;
  calculation: ReturnType<typeof calculateReactionPlan> | null;
  updateReagent: (id: string, key: keyof ReactionReagentInput, value: string | number | undefined) => void;
  addReagent: () => void;
  removeReagent: (id: string) => void;
}) {
  return <>
    <StepHeading title="Reaction plan" description="The starting material is the limiting reagent. All values below are editable and update the deterministic plan." />
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <Metric label="Limiting reagent" value={form.limitingReagent || "Missing name"} />
      <Metric label="Calculated amount" value={`${format(calculation?.limitingMmol)} mmol`} />
      <Metric label="Approx. solvent" value={`${format(calculation?.approximateSolventVolumeMl)} mL ${form.solvent || ""}`} />
    </div>
    <div className="mb-5 rounded-md border border-copper/20 bg-copper/5 p-4 text-sm leading-6 text-ink/72">
      <p className="font-semibold text-ink">Assumptions</p>
      <ul className="mt-2 grid gap-1.5">
        <li>Target concentration is applied to limiting-reagent mmol.</li>
        <li>Solid masses use MW and equivalents; liquid volumes require density; solutions require stock concentration.</li>
        <li>Solvent volume is a planning estimate and must be adjusted for solubility and the approved procedure.</li>
      </ul>
    </div>
    <ReagentInputTable reagents={form.reagents} calculated={calculation?.reagents} updateReagent={updateReagent} addReagent={addReagent} removeReagent={removeReagent} />
  </>;
}

function CheckStep({ status, error, missing, warnings }: { status: string; error: string | null; missing: string[]; warnings: string[] }) {
  const statusStyle = status === "Passed" ? "border-moss/30 bg-mint/45 text-moss" : status === "Needs review" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800";
  return <>
    <StepHeading title="Check the plan" description="BindLab checks arithmetic inputs and highlights questions for review. This is not safety approval and does not replace supervisor or SOP review." />
    <div className={`rounded-md border p-5 ${statusStyle}`}>
      <div className="flex items-center gap-3"><ClipboardCheck size={22} /><div><p className="text-xs font-semibold uppercase tracking-[0.16em]">Calculation status</p><p className="mt-1 text-2xl font-semibold">{status}</p></div></div>
    </div>
    {error && <IssuePanel title="Calculation issue" items={[error]} critical />}
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <IssuePanel title="Missing information" items={missing} empty="All required planning values are present." />
      <IssuePanel title="Review reminders" items={warnings} empty="No preliminary reminders flagged." warning />
    </div>
    <p className="mt-5 rounded-md bg-paper p-4 text-sm leading-6 text-ink/68"><strong>Review boundary:</strong> Confirm compatibility, exact order of addition, PPE, waste, scale, and institutional requirements with the approved method and supervisor.</p>
  </>;
}

function ExecuteStep({ protocol, onProtocolChange }: { protocol: string; onProtocolChange: (value: string) => void }) {
  return <>
    <StepHeading title="Generate workflow" description="This is an editable preparation draft created from the entered reaction plan. It is not an approved experimental procedure." />
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle className="mr-2 inline-block" size={16} />Draft protocol: verify all details against the approved procedure before bench work.</div>
    <label className="mt-5 grid gap-2"><FieldLabel>Editable numbered protocol</FieldLabel><textarea rows={18} value={protocol} onChange={(event) => onProtocolChange(event.target.value)} className="rounded-md border border-ink/15 bg-paper px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-moss" /></label>
  </>;
}

function RecordStep({ form, status, plan, savedAt, onSave }: { form: ExperimentForm; status: string; plan: ReturnType<typeof calculateReactionPlan> | null; savedAt: string | null; onSave: () => void }) {
  return <>
    <StepHeading title="Save record" description="Save an exportable local demonstration record. This browser-only storage is not a secure lab database." />
    <div className="rounded-md border border-copper/20 bg-copper/5 p-4 text-sm leading-6 text-ink/72"><span className="font-semibold text-copper">Demo / local record</span><br />This record is stored in this browser only. It is suitable for the competition demo, not shared lab recordkeeping.</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <Metric label="Experiment" value={form.reactionName} />
      <Metric label="Calculation status" value={status} />
      <Metric label="Workflow" value={form.workflowType} />
      <Metric label="Reagent rows" value={String(plan?.reagents.length ?? 0)} />
    </div>
    <button type="button" onClick={onSave} className="mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-5 py-3 font-semibold text-paper"><Save size={17} />Save demo record locally</button>
    {savedAt && <p className="mt-4 rounded-md bg-mint px-4 py-3 text-sm font-semibold text-moss">Saved locally at {savedAt}. You can review it in My records.</p>}
  </>;
}

function ReagentInputTable({ reagents, calculated, updateReagent, addReagent, removeReagent, compact = false }: {
  reagents: ReactionReagentInput[];
  calculated?: ReturnType<typeof calculateReactionPlan>["reagents"];
  updateReagent: (id: string, key: keyof ReactionReagentInput, value: string | number | undefined) => void;
  addReagent: () => void;
  removeReagent: (id: string) => void;
  compact?: boolean;
}) {
  return <div className="mt-7">
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Reagents</h2><p className="mt-1 text-sm text-ink/62">Add only the values you know. BindLab will show missing density or stock concentration rather than guessing.</p></div><button type="button" onClick={addReagent} className="inline-flex items-center gap-2 rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold"><Plus size={16} />Add reagent</button></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[1080px] border-separate border-spacing-y-2 text-sm"><thead className="text-left text-xs font-semibold uppercase tracking-wide text-ink/55"><tr><th className="px-2">Reagent</th><th className="px-2">Role</th><th className="px-2">State</th><th className="px-2">MW</th><th className="px-2">Equiv.</th>{!compact && <th className="px-2">mmol</th>}<th className="px-2">Density</th><th className="px-2">Stock M</th>{!compact && <th className="px-2">Mass / volume</th>}<th className="px-2">Notes</th><th className="px-2" /></tr></thead><tbody>{reagents.map((reagent) => { const item = calculated?.find((output) => output.id === reagent.id); return <tr key={reagent.id} className="bg-paper/70"><td className="px-2 py-2"><input value={reagent.name} onChange={(event) => updateReagent(reagent.id, "name", event.target.value)} className="w-44 rounded-md border border-ink/15 bg-white px-2.5 py-2" /></td><td className="px-2 py-2"><select value={reagent.role} onChange={(event) => updateReagent(reagent.id, "role", event.target.value)} className="rounded-md border border-ink/15 bg-white px-2 py-2">{reagentRoles.map((role) => <option key={role}>{role}</option>)}</select></td><td className="px-2 py-2"><select value={reagent.state} onChange={(event) => updateReagent(reagent.id, "state", event.target.value)} className="rounded-md border border-ink/15 bg-white px-2 py-2">{reagentStates.map((state) => <option key={state}>{state}</option>)}</select></td><td className="px-2 py-2"><MiniNumber value={reagent.molecularWeight} onChange={(value) => updateReagent(reagent.id, "molecularWeight", value)} /></td><td className="px-2 py-2"><MiniNumber value={reagent.equivalents} onChange={(value) => updateReagent(reagent.id, "equivalents", value)} /></td>{!compact && <td className="px-2 py-2 font-semibold">{format(item?.mmol)}</td>}<td className="px-2 py-2"><MiniNumber value={reagent.density} onChange={(value) => updateReagent(reagent.id, "density", value)} /></td><td className="px-2 py-2"><MiniNumber value={reagent.stockConcentration} onChange={(value) => updateReagent(reagent.id, "stockConcentration", value)} /></td>{!compact && <td className="px-2 py-2 font-semibold">{item?.displayAmount ?? "-"}</td>}<td className="px-2 py-2"><input value={reagent.notes ?? ""} placeholder={item?.missingData[0] ?? "Optional note"} onChange={(event) => updateReagent(reagent.id, "notes", event.target.value)} className="w-40 rounded-md border border-ink/15 bg-white px-2.5 py-2 text-xs" /></td><td className="px-2 py-2"><button type="button" onClick={() => removeReagent(reagent.id)} aria-label={`Remove ${reagent.name}`} className="rounded-md border border-ink/15 p-2 text-ink/60 hover:text-ink"><Trash2 size={15} /></button></td></tr>; })}</tbody></table></div>
  </div>;
}

function StepHeading({ title, description }: { title: string; description: string }) { return <div className="mb-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-mint text-moss"><FlaskConical size={19} /></span><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-1 max-w-3xl leading-6 text-ink/65">{description}</p></div></div></div>; }
function FieldLabel({ children }: { children: React.ReactNode }) { return <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/58">{children}</span>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5"><FieldLabel>{label}</FieldLabel><input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-moss" /></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="grid gap-1.5"><FieldLabel>{label}</FieldLabel><input type="number" step="any" value={value} onChange={(event) => onChange(Number(event.target.value))} className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-moss" /></label>; }
function SelectField({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) { return <label className="grid gap-1.5"><FieldLabel>{label}</FieldLabel><select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-ink/15 bg-white px-3 py-2 outline-none focus:border-moss">{values.map((item) => <option key={item}>{item}</option>)}</select></label>; }
function MiniNumber({ value, onChange }: { value?: number; onChange: (value: number | undefined) => void }) { return <input type="number" step="any" value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))} className="w-24 rounded-md border border-ink/15 bg-white px-2.5 py-2" />; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-ink/10 bg-paper p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/52">{label}</p><p className="mt-2 break-words font-semibold text-ink">{value}</p></div>; }
function IssuePanel({ title, items, empty, warning = false, critical = false }: { title: string; items: string[]; empty?: string; warning?: boolean; critical?: boolean }) { const style = critical ? "border-red-200 bg-red-50" : warning ? "border-amber-200 bg-amber-50" : "border-ink/10 bg-paper"; return <div className={`rounded-md border p-4 ${style}`}><p className="font-semibold">{title}</p>{items.length ? <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/72">{items.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-3 text-sm text-ink/62">{empty}</p>}</div>; }
