type Release = () => void;

const active = new Map<string, number>();

/**
 * Best-effort per-instance concurrency protection. Distributed request counts
 * remain enforced by Redis; this guard limits simultaneous expensive work on
 * each Vercel function instance and is not represented as a global lock.
 */
export function acquireConcurrencySlot(scope: string, maximum: number): Release | null {
  const current = active.get(scope) ?? 0;
  if (current >= maximum) return null;
  active.set(scope, current + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const next = Math.max(0, (active.get(scope) ?? 1) - 1);
    if (next === 0) active.delete(scope);
    else active.set(scope, next);
  };
}
