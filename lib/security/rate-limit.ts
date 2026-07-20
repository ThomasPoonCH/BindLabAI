import { privacyPreservingClientId } from "./http";

type Limit = { limit: number; windowSeconds: number; prefix: string };
type Result = { allowed: boolean; remaining: number; retryAfterSeconds: number; configured: boolean };

const developmentCounters = new Map<string, { count: number; resetAt: number }>();

async function upstashLimit(key: string, rule: Limit): Promise<Result> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return { allowed: false, remaining: 0, retryAfterSeconds: rule.windowSeconds, configured: false };
  const bucket = `${rule.prefix}:${Math.floor(Date.now() / (rule.windowSeconds * 1000))}:${key}`;
  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["INCR", bucket], ["EXPIRE", bucket, rule.windowSeconds, "NX"]]),
    cache: "no-store",
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) throw new Error("Shared rate limiter unavailable");
  const payload = await response.json() as Array<{ result?: number }>;
  const count = Number(payload[0]?.result ?? rule.limit + 1);
  return {
    allowed: count <= rule.limit,
    remaining: Math.max(0, rule.limit - count),
    retryAfterSeconds: rule.windowSeconds,
    configured: true,
  };
}

function developmentLimit(key: string, rule: Limit): Result {
  const now = Date.now();
  const cacheKey = `${rule.prefix}:${key}`;
  const current = developmentCounters.get(cacheKey);
  const next = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + rule.windowSeconds * 1000 }
    : { ...current, count: current.count + 1 };
  developmentCounters.set(cacheKey, next);
  return {
    allowed: next.count <= rule.limit,
    remaining: Math.max(0, rule.limit - next.count),
    retryAfterSeconds: Math.max(1, Math.ceil((next.resetAt - now) / 1000)),
    configured: false,
  };
}

export async function rateLimit(request: Request, rule: Limit, userId?: string | null): Promise<Result> {
  const key = userId ? `user:${userId}` : `network:${privacyPreservingClientId(request)}`;
  try {
    const shared = await upstashLimit(key, rule);
    if (shared.configured) return shared;
  } catch {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, remaining: 0, retryAfterSeconds: rule.windowSeconds, configured: false };
    }
  }
  if (process.env.NODE_ENV === "production") {
    return { allowed: false, remaining: 0, retryAfterSeconds: rule.windowSeconds, configured: false };
  }
  return developmentLimit(key, rule);
}
