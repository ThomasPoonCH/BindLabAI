import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const key = process.env.GEMINI_API_KEY;
if (!key) { console.log("API key detected: NO"); process.exit(1); }
const started = Date.now();
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
const body = await response.json().catch(() => ({}));
console.log(`API key detected: YES`);
console.log(`models.list HTTP status: ${response.status}`);
if (!response.ok) { console.log(`Error category: ${response.status === 401 ? "INVALID_API_KEY" : response.status === 403 ? "PERMISSION_DENIED" : response.status === 429 ? "QUOTA_EXCEEDED" : "MODEL_DISCOVERY_FAILED"}`); process.exit(1); }
const models = (body.models ?? []).filter(model => model.supportedGenerationMethods?.includes("generateContent"));
console.log(`Generation models found: ${models.length}`);
for (const model of models) console.log(model.name.replace(/^models\//, ""));
console.log(`Discovery latency: ${Date.now() - started} ms`);
const candidates = [...new Set([process.env.GEMINI_FAST_MODEL, process.env.GEMINI_PRIMARY_MODEL, process.env.GEMINI_MODEL, process.env.GEMINI_FALLBACK_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemma-4-31b-it"].filter(Boolean))];
for (const model of candidates) {
  if (!models.some(item => item.name === `models/${model}`)) continue;
  const t = Date.now();
  const probe = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: "Reply exactly: BINDLAB_MODEL_READY" }] }], generationConfig: { maxOutputTokens: 8, temperature: 0 } }), signal: AbortSignal.timeout(5000) }).catch(error => ({ ok: false, status: 0, error }));
  console.log(`${model}: ${probe.ok ? "LIVE" : probe.status === 0 ? "TIMEOUT" : probe.status === 401 ? "INVALID_API_KEY" : probe.status === 403 ? "PERMISSION_DENIED" : probe.status === 404 ? "MODEL_NOT_FOUND" : probe.status === 429 ? "QUOTA_EXCEEDED" : `HTTP_${probe.status}`} (${Date.now() - t} ms)`);
}
