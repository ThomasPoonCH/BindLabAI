"use client";

import { experimentBackup, parseExperimentBackup, downloadFile } from "@/lib/experiment-export";
import { listExperiments, importExperiments } from "@/lib/experiment-repository";
import { useEffect, useState } from "react";

type LocalExperiment = {
  id?: string;
  experimentId?: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  originalInstruction?: string;
};

export function LocalExperiments() {
  const [error, setError] = useState("");
  const [experiments, setExperiments] = useState<LocalExperiment[]>([]);

  useEffect(() => {
    try {
      const canonical = JSON.parse(localStorage.getItem("bindlab-canonical-experiments") ?? "[]") as unknown;
      const legacy = JSON.parse(localStorage.getItem("bindlab-experiments") ?? "[]") as unknown;
      const safe = (items: unknown) => Array.isArray(items) ? items.filter((item): item is LocalExperiment => Boolean(item && typeof item === "object" && ("experimentId" in item || "id" in item))) : [];
      setExperiments([...safe(canonical), ...safe(legacy)]);
    } catch { setError("Browser records could not be read. They have not been deleted. Check browser storage access and try refreshing."); }
  }, []);

  if (error) return <p role="alert" className="rounded-md border border-ink/10 p-4 text-sm">{error}</p>;

  const backupControls = <div className="mb-5 flex flex-wrap gap-3 text-sm"><button className="rounded-md border border-ink/15 px-3 py-2" onClick={() => { try { downloadFile(experimentBackup(listExperiments()), "bindlab-experiments-backup.json", "application/json"); } catch { setError("Backup failed. Existing records remain in this browser."); } }}>Download all record backups</button><label className="cursor-pointer rounded-md border border-ink/15 px-3 py-2">Import backup<input className="sr-only" type="file" accept="application/json,.json" onChange={async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try { if (file.size > 5 * 1024 * 1024) throw new Error("Backup must be 5 MB or smaller."); const records = parseExperimentBackup(await file.text()); await importExperiments(records); setExperiments(listExperiments().map(record => ({ ...record, title: record.title ?? "Untitled" }))); } catch (error) { setError(error instanceof Error ? error.message : "Import failed; no records were changed."); }
    event.target.value = "";
  }} /></label><p className="w-full text-ink/60">Imports create new copies and require renewed confirmation. Existing records are never replaced.</p></div>;
  if (!experiments.length) {
    return (
      <div>{backupControls}<div className="rounded-md border border-dashed border-ink/20 bg-white p-8 text-center">
        <h2 className="text-xl font-semibold">No local reaction exports yet</h2>
        <p className="mt-2 text-ink/65">Use New Reaction Workflow and click Save locally.</p>
      </div></div>
    );
  }

  return (
    <div>{backupControls}<div className="grid gap-4">
      {experiments.map((experiment) => (
        <article key={experiment.experimentId ?? experiment.id} className="rounded-md border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{experiment.title}</h2>
              <p className="mt-1 text-sm text-ink/55">{new Date(experiment.updatedAt ?? experiment.createdAt).toLocaleString()}</p>
            </div>
            {experiment.experimentId ? <a href={`/dashboard/experiments/${experiment.experimentId}`} className="rounded-md border border-ink/15 px-3 py-2 text-sm font-semibold">Open record</a> : <span className="rounded-md border border-ink/10 px-3 py-2 text-sm text-ink/55">Legacy local export</span>}
          </div>
          {experiment.originalInstruction && <p className="mt-4 rounded-md bg-paper p-4 text-sm leading-6 text-ink/70">{experiment.originalInstruction}</p>}
        </article>
      ))}
    </div></div>
  );
}
