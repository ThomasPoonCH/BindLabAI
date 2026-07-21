import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAiConfig } from "./config";

export type ModelHealth = { modelId: string; available: boolean; lastCheckedAt: string; latencyMs: number | null; failureCode?: string };
type Cache = { expiresAt: number; models: ModelHealth[] };
let cache: Cache | null = null;
const cacheMs = 5 * 60_000;

function classify(status: number, message: string) {
  if (status === 401) return "INVALID_API_KEY";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 404) return "MODEL_NOT_FOUND";
  if (status === 429) return "QUOTA_EXCEEDED";
  if (status >= 500) return "TEMPORARY_PROVIDER_FAILURE";
  return message || "MODEL_UNAVAILABLE";
}

export async function discoverModels(force = false): Promise<ModelHealth[]> {
  if (!force && cache && cache.expiresAt > Date.now()) return cache.models;
  const config = getAiConfig();
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(config.apiKey)}`, { signal: controller.signal, cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(classify(response.status, "Model discovery failed"));
    const discovered = Array.isArray(body.models) ? body.models.filter((model: { supportedGenerationMethods?: string[] }) => model.supportedGenerationMethods?.includes("generateContent")).map((model: { name?: string }) => String(model.name ?? "").replace(/^models\//, "")).filter(Boolean) : [];
    const configured = [process.env.GEMINI_FAST_MODEL, process.env.GEMINI_PRIMARY_MODEL, process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL].map(value => value?.trim()).filter((value): value is string => Boolean(value));
    const candidates = [...new Set([...configured, ...discovered])];
    const models = candidates.map(modelId => ({ modelId, available: discovered.includes(modelId), lastCheckedAt: new Date().toISOString(), latencyMs: null, failureCode: discovered.includes(modelId) ? undefined : "MODEL_NOT_FOUND" }));
    cache = { expiresAt: Date.now() + cacheMs, models };
    return models;
  } finally { clearTimeout(timer); void started; }
}

export async function verifiedModelOrder() {
  const models = await discoverModels();
  const available = new Set(models.filter(model => model.available).map(model => model.modelId));
  const configured = [process.env.GEMINI_FAST_MODEL, process.env.GEMINI_PRIMARY_MODEL, process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash", "gemma-4-31b-it"].map(value => value?.trim()).filter((value): value is string => Boolean(value));
  const candidates = [...new Set(configured.filter(model => available.has(model)))].slice(0, 4);
  const verified: string[] = [];
  for (const modelId of candidates) {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 5_000); const started = Date.now();
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(getAiConfig().apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "Reply exactly: BINDLAB_MODEL_READY" }] }], generationConfig: { maxOutputTokens: 8, temperature: 0 } }), signal: controller.signal, cache: "no-store" });
      if (response.ok) verified.push(modelId);
      else if (response.status === 404) clearModelHealthCache();
    } catch { /* A slow model is skipped before the main extraction call. */ }
    finally { clearTimeout(timer); void started; }
    if (verified.length >= 2) break;
  }
  return verified;
}

export function clearModelHealthCache() { cache = null; }
