"use client";

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
  const [experiments, setExperiments] = useState<LocalExperiment[]>([]);

  useEffect(() => {
    try {
      const canonical = JSON.parse(localStorage.getItem("bindlab-canonical-experiments") ?? "[]") as unknown;
      const legacy = JSON.parse(localStorage.getItem("bindlab-experiments") ?? "[]") as unknown;
      const safe = (items: unknown) => Array.isArray(items) ? items.filter((item): item is LocalExperiment => Boolean(item && typeof item === "object" && ("experimentId" in item || "id" in item))) : [];
      setExperiments([...safe(canonical), ...safe(legacy)]);
    } catch { setExperiments([]); }
  }, []);

  if (!experiments.length) {
    return (
      <div className="rounded-md border border-dashed border-ink/20 bg-white p-8 text-center">
        <h2 className="text-xl font-semibold">No local reaction exports yet</h2>
        <p className="mt-2 text-ink/65">Use New Reaction Workflow and click Save locally.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
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
    </div>
  );
}
