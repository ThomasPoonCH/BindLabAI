"use client";
import { useRef, useState } from "react";
import { feedbackSchema, feedbackEmail } from "@/lib/feedback";
import { downloadFile } from "@/lib/experiment-export";

export function Feedback() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Bug"); const [description, setDescription] = useState(""); const [contact, setContact] = useState("");
  const [feature, setFeature] = useState("Experiment builder"); const [role, setRole] = useState(""); const [rating, setRating] = useState(""); const [website, setWebsite] = useState("");
  const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const inFlight = useRef(false); const receipt = useRef<{ fingerprint: string; id: string } | null>(null);
  function payload() {
    const fields = { category, description, contact, feature, role, rating: rating ? Number(rating) : null, website };
    const fingerprint = JSON.stringify(fields); if (receipt.current?.fingerprint !== fingerprint) receipt.current = { fingerprint, id: crypto.randomUUID() };
    const parsed = feedbackSchema.safeParse({ ...fields, id: receipt.current.id });
    if (!parsed.success) { setNotice("Choose a feature and category, describe the issue in 5–5000 characters, and check the optional email."); return null; }
    return parsed.data;
  }
  async function submit() {
    if (inFlight.current) return; const data = payload(); if (!data) return;
    inFlight.current = true; setBusy(true); setNotice("");
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), signal: AbortSignal.timeout(15_000) });
      const result = await response.json().catch(() => null);
      setNotice(response.ok && result?.ok && result.receipt === data.id ? "Feedback submitted and stored for BindLab administrator review. Thank you." : "Feedback was not delivered. Your text is preserved. Retry, download it, or use the configured email option.");
    } catch { setNotice("Delivery could not be confirmed. Your text is preserved; retry safely with the same receipt or download it."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  const input = "mt-1 w-full rounded border p-2 text-ink bg-white";
  return <div className="mt-5 text-sm"><button aria-expanded={open} onClick={() => setOpen(!open)}>Report a Problem / Give Feedback</button>{open && <div className="mt-3 grid max-w-lg gap-3 rounded-md border border-current/20 p-4"><p>Only the fields below are submitted to BindLab&apos;s configured feedback store. Do not include confidential research data. No experiment contents, PDFs or diagnostics are attached. Contact details are optional.</p><label>Category<select className={input} value={category} onChange={e => setCategory(e.target.value)}>{["Bug", "Calculation error", "AI accuracy", "Feature request", "General feedback"].map(item => <option key={item}>{item}</option>)}</select></label><label>Relevant feature<select className={input} value={feature} onChange={e => setFeature(e.target.value)}>{["Experiment builder", "Calculators", "LC-MS/HPLC", "Records / export", "Live Bench", "Other"].map(item => <option key={item}>{item}</option>)}</select></label><label>Description<textarea maxLength={5000} className={input} value={description} onChange={e => setDescription(e.target.value)} /></label><label>Contact email (optional)<input type="email" maxLength={254} className={input} value={contact} onChange={e => setContact(e.target.value)} /></label><label>Researcher role (optional)<input maxLength={100} className={input} value={role} onChange={e => setRole(e.target.value)} /></label><label>Usefulness (optional)<select className={input} value={rating} onChange={e => setRating(e.target.value)}><option value="">Not provided</option>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label><label hidden aria-hidden="true">Website<input tabIndex={-1} value={website} onChange={e => setWebsite(e.target.value)} /></label><div className="flex flex-wrap gap-4"><button disabled={busy} onClick={() => void submit()}>{busy ? "Submitting…" : "Submit feedback"}</button><button disabled={!description.trim()} onClick={() => { const data = payload(); if (data) { downloadFile(JSON.stringify(data, null, 2), "bindlab-feedback.json", "application/json"); setNotice("Feedback prepared for download. It has not been sent. Share it with the person who invited you."); } }}>Download feedback</button>{process.env.NEXT_PUBLIC_FEEDBACK_EMAIL && <button onClick={() => { const data = payload(); if (!data) return; const link = feedbackEmail(data, process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? ""); if (link) { window.location.href = link; setNotice("Email draft opened. You must send it in your email application; delivery is not confirmed by BindLab."); } }}>Open email to send feedback</button>}</div><p role="status">{notice}</p></div>}</div>;
}
