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
export function saveExperiment(record: ExperimentRecord, expectedVersion?: string) {
  // Refuse to overwrite unreadable or incompatible records. Keep their original bytes intact.
  let all: ExperimentRecord[];
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    all = parseStoredExperiments(raw);
    if (!Array.isArray(raw) || all.length !== raw.length) throw new Error("incompatible records");
  } catch {
    throw new Error("Your changes have not been saved. Existing browser records could not be read; export or recover them before trying again.");
  } const next = experimentSchema.parse({ ...record, updatedAt: new Date().toISOString(), storageRevision: crypto.randomUUID() }); const index = all.findIndex(item => item.experimentId === next.experimentId); if (index >= 0 && expectedVersion && (all[index].storageRevision ?? all[index].updatedAt) !== expectedVersion) throw new Error("This record changed in another tab. Your changes have not been saved. Download a backup of this page before reopening the latest record."); if (index >= 0) all[index] = next; else all.unshift(next); try { localStorage.setItem(key, JSON.stringify(all)); } catch { throw new Error("Your changes have not been saved. Browser storage may be full or unavailable. Keep this page open and try again."); } return next; }

export async function saveExperimentSafely(record: ExperimentRecord, expectedVersion?: string) {
  const write = () => saveExperiment(record, expectedVersion);
  if (typeof navigator !== "undefined" && navigator.locks) return navigator.locks.request(key, write);
  return write();
}
export async function importExperiments(records: ExperimentRecord[]) {
  const write = () => {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    const existing = parseStoredExperiments(raw);
    if (!Array.isArray(raw) || existing.length !== raw.length) throw new Error("Existing records are unreadable. No records were imported.");
    const now = new Date().toISOString();
    const added = records.map(record => experimentSchema.parse({ ...record, experimentId: crypto.randomUUID(), createdAt: now, updatedAt: now, storageRevision: crypto.randomUUID(), experimentStatus: "needs_review" }));
    try { localStorage.setItem(key, JSON.stringify([...added, ...existing])); } catch { throw new Error("Import could not be saved. Existing records are unchanged; browser storage may be full."); }
    return added;
  };
  if (typeof navigator !== "undefined" && navigator.locks) return navigator.locks.request(key, write);
  return write();
}
