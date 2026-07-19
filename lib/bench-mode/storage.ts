import type { BenchSession } from "./types";

const storageKey = "bindlab-live-bench-demo-v1";

export function loadBenchSession(): BenchSession | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "null") as BenchSession | null;
    return parsed?.startedAt && parsed.updatedPlan && Array.isArray(parsed.timeline) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBenchSession(session: BenchSession) {
  if (typeof window !== "undefined") localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearBenchSession() {
  if (typeof window !== "undefined") localStorage.removeItem(storageKey);
}
