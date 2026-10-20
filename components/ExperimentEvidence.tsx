"use client";
import type { ExperimentRecord, FieldEvidence } from "@/lib/ai/experiment-schema";
import { conditionFields, reagentFields, recordFields, fieldEvidence, evidenceLabels, established, confirmEvidence, recordEdits } from "@/lib/experiment-evidence";

export function ExperimentEvidence({ record, onChange }: { record: ExperimentRecord; onChange: (record: ExperimentRecord) => void }) {
  const rows = [
    ...record.reagents.flatMap((reagent, index) => reagentFields.map(field => ({ group: reagent.name || `Reagent ${index + 1}`, field, value: reagent[field], evidence: reagent.fieldEvidence?.[field], confirm: () => onChange({ ...record, reagents: record.reagents.map((row, i) => i === index ? { ...row, fieldEvidence: { ...row.fieldEvidence, [field]: confirmEvidence(row.fieldEvidence?.[field]) } } : row) }) }))),
    ...conditionFields.map(field => ({ group: "Conditions", field, value: record.conditions[field], evidence: record.conditions.fieldEvidence?.[field], confirm: () => onChange({ ...record, conditions: { ...record.conditions, fieldEvidence: { ...record.conditions.fieldEvidence, [field]: confirmEvidence(record.conditions.fieldEvidence?.[field]) } } }) })),
    ...recordFields.map(field => ({ group: "Procedure", field, value: record[field], evidence: record.fieldEvidence?.[field], confirm: () => onChange({ ...record, fieldEvidence: { ...record.fieldEvidence, [field]: confirmEvidence(record.fieldEvidence?.[field]) } }) })),
  ];
  const label = (value: unknown, evidence?: FieldEvidence) => evidenceLabels[fieldEvidence(value, evidence).status];
  return <details className="mt-5 border-t border-ink/10 pt-5"><summary className="cursor-pointer font-semibold">Field evidence and confirmation</summary><p className="mt-3 text-sm text-ink/65">Source Extracted means reported by extraction, not independently verified. Edit values above or confirm each field against your reference. Confirmation applies only to that field. Calculation results remain Calculated.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr><th>Reagent / section</th><th>Field</th><th>Value</th><th>Evidence</th><th>Review</th></tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-t border-ink/10"><td className="py-2 pr-2">{row.group}</td><td className="pr-2">{row.field}</td><td className="max-w-48 break-words pr-2">{established(row.value) ? String(row.value) : "Not specified"}</td><td className="max-w-64 break-words pr-2"><span>{label(row.value, row.evidence)}</span>{row.evidence?.sourceReference && <p className="text-xs text-ink/55">Reported source: {row.evidence.sourceReference}</p>}{row.evidence?.sourceExcerpt && <p className="text-xs text-ink/55">{row.evidence.sourceExcerpt}</p>}</td><td>{established(row.value) && row.evidence?.status !== "researcher_confirmed" && <button className="rounded border border-ink/15 px-2 py-1" aria-label={`Confirm ${row.group} ${row.field}`} onClick={row.confirm}>Confirm field</button>}</td></tr>)}</tbody></table></div></details>;
}
// Edits to one condition must never confirm all other conditions.
export function editConditions(record: ExperimentRecord, patch: Partial<ExperimentRecord["conditions"]>) {
  return { ...record, conditions: recordEdits(record.conditions, patch), updatedAt: new Date().toISOString() };
}
