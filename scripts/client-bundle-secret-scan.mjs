import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "dotenv";

const root = ".next/static";
const files = [];
function walk(directory) {
  if (!existsSync(directory)) return;
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(?:js|css|map)$/.test(name)) files.push(path);
  }
}
walk(root);

const serverOnlyNames = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "UPSTASH_REDIS_REST_TOKEN"];
const values = existsSync(".env.local") ? parse(readFileSync(".env.local")) : {};
const findings = [];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const name of serverOnlyNames) {
    if (content.includes(name)) findings.push({ file, variable: name, category: "server-variable-name" });
    const value = values[name]?.trim();
    if (value && value.length >= 8 && content.includes(value)) findings.push({ file, variable: name, category: "secret-value" });
  }
  if (/AIza[0-9A-Za-z_-]{20,}/.test(content)) findings.push({ file, variable: "unknown-google-key", category: "secret-looking-value" });
}

console.log(JSON.stringify({ scannedFiles: files.length, findings }, null, 2));
if (findings.length) process.exitCode = 1;
