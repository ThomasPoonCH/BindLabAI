"use client";
import { useState } from "react";
import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
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
  SCHEMA_VALIDATION_ERROR: "The AI returned an invalid experiment draft. No experiment was saved.",
  INVALID_AI_OUTPUT: "Enter an experiment description between 10 and 12,000 characters.",
  UNKNOWN_ERROR: "The AI request failed. Use the request ID shown below to inspect the server log.",
};
type ApiError = { code?: string; message?: string; requestId?: string };

export function AiBuilder({ onApplyDraft }: { onApplyDraft: (draft: ExperimentRecord) => void }) {
  const [instruction, setInstruction] = useState(""); const [record, setRecord] = useState<ExperimentRecord | null>(null); const [error, setError] = useState<ApiError | null>(null); const [loading, setLoading] = useState(false); const [confirmed, setConfirmed] = useState(false);
  async function generate() {
    if (loading) return; setLoading(true); setError(null);
    try { const response = await fetch("/api/ai/experiment-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instruction }) }); const payload = await response.json().catch(() => null); if (!response.ok || !payload?.ok) { setError(payload?.error ?? { code: "UNKNOWN_ERROR" }); return; } setRecord(payload.draft); setConfirmed(false); }
    catch { setError({ code: "NETWORK_ERROR" }); } finally { setLoading(false); }
  }
  const errorMessage = error ? messages[error.code ?? "UNKNOWN_ERROR"] ?? messages.UNKNOWN_ERROR : "";
  return <section className="mb-6 rounded-md border border-copper/20 bg-white p-5 shadow-sm"><div className="flex gap-3"><Sparkles className="text-copper" /><div><h2 className="text-xl font-semibold">Build Experiment with AI</h2><p className="mt-1 text-sm text-ink/65">AI extracts a draft only. Calculations and saving remain gated by your review.</p></div></div><textarea value={instruction} onChange={e => setInstruction(e.target.value)} rows={7} placeholder="Paste supervisor instructions or protocol text." className="mt-4 w-full rounded-md border border-ink/15 p-3" /><div className="mt-3 flex flex-wrap items-center gap-3"><button onClick={generate} disabled={loading || instruction.trim().length < 10} className="rounded-md bg-ink px-4 py-2 font-semibold text-paper disabled:opacity-50">{loading ? "Generating draft..." : "Generate Experiment"}</button>{error && <button onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-ink/20 px-3 py-2 text-sm font-semibold disabled:opacity-50"><RotateCcw size={15} />Retry</button>}</div>{error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"><div className="flex gap-2"><AlertTriangle size={17} /><p>{errorMessage}</p></div>{error.requestId && <p className="mt-2 pl-6 text-xs text-red-700/75">Request ID: {error.requestId}</p>}</div>}{record && <div className="mt-5 grid gap-4 rounded-md bg-paper p-4"><p className="font-semibold">Editable AI Draft - original instruction preserved</p><label>Title<input value={record.title ?? ""} onChange={e => setRecord({ ...record, title: e.target.value })} className="ml-2 rounded border p-1" /></label><p>Missing information: {record.missingInformation?.join("; ") || "None returned"}</p><p>Assumptions: {record.assumptions?.join("; ") || "None returned"}</p><label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I reviewed AI assumptions before applying.</label><button disabled={!confirmed} onClick={() => onApplyDraft(record)} className="w-fit rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper disabled:opacity-40">Apply to Experiment Workspace</button></div>}</section>;
}
