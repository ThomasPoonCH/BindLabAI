"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function ResultBox({
  result,
  invalid = false,
  warning,
  calculatorType = "calculator",
  formula,
  explanation,
  inputs,
  projectId
}: {
  result: string;
  invalid?: boolean;
  warning?: string | null;
  calculatorType?: string;
  formula?: string;
  explanation?: string;
  inputs?: Record<string, unknown>;
  projectId?: string | null;
}) {
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  async function copyResult() { try { await navigator.clipboard.writeText(result); setNotice("Result copied."); } catch { setNotice("Copy failed. Select and copy the result manually."); } }

  async function saveToProject() {
    if (!projectId || invalid || saving) return;
    setSaving(true);
    try { const response = await fetch("/api/calculation-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        projectId,
        calculatorType,
        inputJson: inputs ?? {},
        resultJson: { result },
        formula,
        explanation
      })
    }); if (!response.ok) throw new Error(); setNotice("Calculation saved to the project."); } catch { setNotice("Calculation was not saved. Please retry."); } finally { setSaving(false); }
  }

  return (
    <div className={`rounded-md border p-4 ${invalid ? "border-copper/20 bg-paper" : "border-moss/20 bg-mint/40"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">{invalid ? "Calculation needs valid inputs" : "Calculated result"}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{result}</p>
        </div>
        <button type="button" disabled={invalid} onClick={copyResult} className="rounded-md border border-ink/10 bg-white p-2 text-ink/70 hover:text-ink" aria-label="Copy result">
          <Copy size={16} />
        </button>
      </div>
      {projectId && (
        <button type="button" disabled={invalid || saving} onClick={saveToProject} className="mt-3 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink/75">
          Add result to current project
        </button>
      )}
      {formula && <div className="mt-3 rounded-md bg-white/75 px-3 py-2 text-sm text-ink/75"><strong>Formula:</strong> <span className="font-mono">{formula}</span></div>}
      {explanation && <p className="mt-2 text-sm leading-6 text-ink/68"><strong>Calculation context:</strong> {explanation}</p>}
      <p className="mt-2 text-xs leading-5 text-ink/55">Assumptions: required inputs are finite and dimensionally compatible. Internal values are retained before display rounding; confirm method-specific laboratory conditions with your SOP.</p>
      {notice && <p role="status" className="mt-2 text-sm">{notice}</p>}
      {warning && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{warning}</p>}
    </div>
  );
}
