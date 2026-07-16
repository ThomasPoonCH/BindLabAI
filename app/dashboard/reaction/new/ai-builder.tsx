"use client";

import { useState } from "react";
import { AlertTriangle, FileText, RotateCcw, Sparkles, Upload } from "lucide-react";
import { mergeVisualRetryDraft, resolveBuilderResponse, type BuilderError } from "@/lib/ai/builder-response";
import type { ExperimentRecord } from "@/lib/ai/experiment-schema";

const messages: Record<string, string> = {
  CONFIGURATION_ERROR: "BindLab AI is not fully configured on the server. Check the server environment variables.",
  AUTHENTICATION_FAILED: "The AI provider rejected the server credentials. Check the API key configuration.",
  MODEL_NOT_FOUND: "The configured AI model could not be found. Check the GEMINI_MODEL value.",
  MODEL_ACCESS_DENIED: "The configured model is not available for this API key or account.",
  RATE_LIMITED: "The AI service is temporarily rate-limited. Wait briefly and try again.",
  NETWORK_ERROR: "BindLab could not reach the AI provider. Check the server connection and try again.",
  TIMEOUT: "AI generation took too long. Please retry.",
  JSON_PARSE_ERROR: "The AI returned invalid JSON. No experiment was saved.",
  SCHEMA_VALIDATION_ERROR: "The extracted draft did not pass validation. No experiment was saved.",
  INVALID_AI_OUTPUT: "Enter an experiment description or upload a readable reaction PDF.",
  UNKNOWN_ERROR: "The AI request failed. Use the request ID shown below to inspect the server log.",
  INVALID_PDF: "Please choose a PDF file.",
  PDF_TOO_LARGE: "That PDF is too large. Use a file no larger than 15 MB.",
  PDF_NO_TEXT: "BindLab could not read this PDF.",
  PDF_READ_ERROR: "BindLab could not read this PDF. Try an accessible PDF.",
  VISUAL_ANALYSIS_TIMEOUT: "The written PDF content was extracted successfully, but visual content has not yet been verified.",
};

export function AiBuilder({ onApplyDraft }: { onApplyDraft: (draft: ExperimentRecord) => void }) {
  const [instruction, setInstruction] = useState("");
  const [record, setRecord] = useState<ExperimentRecord | null>(null);
  const [error, setError] = useState<BuilderError | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [pdfData, setPdfData] = useState("");
  const [pdfStatus, setPdfStatus] = useState("");

  async function readPdf(file: File | null) {
    setPdfFile(file);
    setPdfText("");
    setPdfData("");
    setPdfStatus("");
    setError(null);
    if (!file) return;
    setPdfStatus("Reading PDF...");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/ai/pdf-extract", { method: "POST", body: form });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setError(payload?.error ?? { code: "PDF_READ_ERROR" });
        return;
      }
      setPdfText(payload.text);
      setPdfData(payload.pdfData ?? "");
      setPdfStatus(`${payload.fileName} ready${payload.scanned ? " (image PDF - vision enabled)" : payload.truncated ? " (text truncated for review)" : ""}`);
    } catch {
      setError({ code: "PDF_READ_ERROR" });
    } finally {
      setPdfStatus((current) => current === "Reading PDF..." ? "" : current);
    }
  }

  async function generate() {
    if (loading) return;
    setLoading(true);
    setError(null);
    const combinedInstruction = [
      instruction.trim(),
      pdfText ? `\n\nSOURCE PDF TEXT (${pdfFile?.name ?? "uploaded PDF"}):\n${pdfText}` : "",
    ].filter(Boolean).join("");
    if (combinedInstruction.length < 10) {
      setError({ code: "INVALID_AI_OUTPUT" });
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/ai/experiment-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: combinedInstruction, pdfData: pdfData || undefined }),
      });
      const result = resolveBuilderResponse(await response.json().catch(() => null));
      if (result.kind === "error") {
        setError(result.error);
        return;
      }
      setRecord((current) => isVisualPartial && current ? mergeVisualRetryDraft(current, result.draft) : result.draft);
      setConfirmed(false);
      setError(result.warning);
    } catch {
      setError({ code: "NETWORK_ERROR" });
    } finally {
      setLoading(false);
    }
  }

  const isVisualPartial = error?.code === "VISUAL_ANALYSIS_TIMEOUT" && Boolean(record);
  const errorMessage = error ? messages[error.code ?? "UNKNOWN_ERROR"] ?? messages.UNKNOWN_ERROR : "";

  return (
    <section className="mb-6 rounded-md border border-copper/20 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <Sparkles className="text-copper" />
        <div>
          <h2 className="text-xl font-semibold">Build Experiment with AI</h2>
          <p className="mt-1 text-sm text-ink/65">AI extracts a draft only. Calculations and saving remain gated by your review.</p>
        </div>
      </div>

      <textarea
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
        rows={7}
        placeholder="Add an instruction, or upload a reaction PDF and add context here."
        className="mt-4 w-full rounded-md border border-ink/15 p-3"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold">
          <Upload size={16} /> Upload reaction PDF
          <input type="file" accept="application/pdf" onChange={(event) => void readPdf(event.target.files?.[0] ?? null)} className="sr-only" />
        </label>
        {pdfFile && <span className="inline-flex items-center gap-2 text-sm text-ink/65"><FileText size={16} />{pdfStatus || pdfFile.name}</span>}
      </div>
      <p className="mt-2 text-xs text-ink/55">Selectable text is extracted on the server. Visual evidence is reviewed separately, and uncertain image-derived values require confirmation.</p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={generate} disabled={loading || (!instruction.trim() && !pdfText)} className="rounded-md bg-ink px-4 py-2 font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Generating draft..." : "Generate Experiment"}
        </button>
        {error && (
          <button onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-3 py-2 text-sm font-semibold disabled:opacity-50">
            <RotateCcw size={15} /> {isVisualPartial ? "Retry Visual Analysis" : "Retry"}
          </button>
        )}
      </div>

      {error && (
        <div className={`mt-4 rounded-md border p-3 text-sm ${isVisualPartial ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`}>
          <div className="flex gap-2"><AlertTriangle size={17} /><p>{errorMessage}</p></div>
          {error.requestId && <p className="mt-2 pl-6 text-xs opacity-75">Request ID: {error.requestId}</p>}
        </div>
      )}

      {record && (
        <div className="mt-5 grid gap-4 rounded-md bg-paper p-4">
          <div>
            <p className="font-semibold">Editable extracted draft</p>
            <p className="text-xs text-ink/55">Nothing is saved until it is applied, reviewed in the canonical workspace, and explicitly saved.</p>
          </div>
          <label className="grid gap-1 text-sm font-medium">Title
            <input value={record.title ?? ""} onChange={(event) => setRecord({ ...record, title: event.target.value })} className="rounded border border-ink/15 bg-white p-2" />
          </label>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead><tr className="border-b border-ink/10"><th className="py-2">Reagent</th><th>Amount</th><th>Source</th><th>Status</th></tr></thead>
              <tbody>{record.reagents.map((reagent) => (
                <tr key={reagent.id} className="border-b border-ink/10">
                  <td className="py-2 font-medium">{reagent.name || "Unnamed"}</td>
                  <td>{reagent.mass != null ? `${reagent.mass} ${reagent.massUnit}` : reagent.amountMmol != null ? `${reagent.amountMmol} mmol` : reagent.volume != null ? `${reagent.volume} ${reagent.volumeUnit}` : reagent.equivalents != null ? `${reagent.equivalents} equiv` : "Not stated"}</td>
                  <td>{reagent.provenance.sourceReference || reagent.provenance.sourceType}</td>
                  <td>{reagent.provenance.confirmedByUser ? "Confirmed" : "Review required"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="text-sm"><strong>Missing information:</strong> {record.missingInformation.join("; ") || "None returned"}</p>
          <p className="text-sm"><strong>Warnings:</strong> {record.warnings.join("; ") || "None returned"}</p>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />I reviewed the extracted evidence and understand that unverified values require confirmation.</label>
          <button disabled={!confirmed} onClick={() => onApplyDraft(record)} className="w-fit rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper disabled:opacity-40">Apply to Experiment Workspace</button>
        </div>
      )}
    </section>
  );
}
