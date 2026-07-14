import { experimentSchema, type ExperimentRecord } from "./ai/experiment-schema";
const key = "bindlab-canonical-experiments";
export function parseStoredExperiments(input: unknown): ExperimentRecord[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap(item => {
    // Records created before explicit condition units are still compatible local records.
    const candidate = item && typeof item === "object" ? { ...(item as object), conditions: { solventVolumeUnit: "mL", targetConcentrationUnit: "M", temperatureUnit: "C", durationUnit: "h", vesselCapacity: null, vesselCapacityUnit: "mL", ...((item as { conditions?: object }).conditions ?? {}) } } : item;
    const parsed = experimentSchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
}
export function listExperiments(): ExperimentRecord[] { if (typeof window === "undefined") return []; try { return parseStoredExperiments(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { return []; } }
export function getExperiment(id: string) { return listExperiments().find(item => item.experimentId === id) ?? null; }
export function saveExperiment(record: ExperimentRecord) { const all = listExperiments(); const next = experimentSchema.parse({ ...record, updatedAt: new Date().toISOString() }); const index = all.findIndex(item => item.experimentId === next.experimentId); if (index >= 0) all[index] = next; else all.unshift(next); localStorage.setItem(key, JSON.stringify(all)); return next; }
