import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());
const model = (process.env.GEMINI_MODEL || "gemma-4-31b-it").trim();
const keyPresent = Boolean(process.env.GEMINI_API_KEY?.trim());
if (!keyPresent) { console.log("AI configuration: GEMINI_API_KEY is missing. Secret value was not displayed."); process.exit(1); }

try {
  const instruction = process.argv.slice(2).join(" ") || "western blot";
  const response = await fetch("http://localhost:3003/api/ai/experiment-builder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ instruction }), signal: AbortSignal.timeout(75_000) });
  const payload = await response.json().catch(() => null);
  if (response.ok && payload?.ok && payload?.draft?.experimentId) { console.log(`AI provider: configured\nAI model: ${model}\nAuthentication: successful\nStructured response: successful\nExperiment schema validation: successful`); }
  else { console.log(`AI provider request failed.\nAI model: ${model}\nError code: ${payload?.error?.code || "UNKNOWN_ERROR"}\nRequest ID: ${payload?.error?.requestId || "not returned"}`); process.exitCode = 1; }
} catch { console.log(`AI provider network test did not complete.\nAI model: ${model}\nError code: NETWORK_ERROR`); process.exitCode = 1; }
