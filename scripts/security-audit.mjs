import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"]).toString().split("\0").filter(Boolean);
const rules = [
  ["google-key", /AIza[0-9A-Za-z_-]{20,}/],
  ["supabase-secret", /sb_secret_[0-9A-Za-z_-]+/],
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["jwt", /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
];
const credentialAssignment = /(?:GEMINI_API_KEY|GOOGLE_API_KEY|OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY)[\t ]*=[\t ]*([^\s"']+)/g;
const placeholder = /(?:your|replace|changeme|example|placeholder|\.\.\.|<|`|\$\{|process\.env)/i;

function scan(scope, file, content) {
  const findings = rules.filter(([, pattern]) => pattern.test(content)).map(([kind]) => ({ scope, file, kind }));
  for (const match of content.matchAll(credentialAssignment)) {
    if (!placeholder.test(match[1])) findings.push({ scope, file, kind: "credential-assignment" });
  }
  return findings;
}

const current = [];
for (const file of tracked) {
  let bytes;
  try { bytes = readFileSync(file); } catch { continue; }
  if (bytes.includes(0) || bytes.length > 2_000_000) continue;
  current.push(...scan("tracked", file, bytes.toString("utf8")));
}

const history = [];
const objects = execFileSync("git", ["rev-list", "--objects", "--all"], { maxBuffer: 50_000_000 }).toString().split("\n").filter(Boolean);
for (const line of objects) {
  const [objectId, ...pathParts] = line.split(" ");
  const file = pathParts.join(" ");
  if (!file || /\.(png|jpe?g|gif|pdf|xlsx?|lock)$/i.test(file)) continue;
  let content;
  try { content = execFileSync("git", ["cat-file", "-p", objectId], { maxBuffer: 2_000_000 }).toString("utf8"); } catch { continue; }
  history.push(...scan("history", file, content));
}

const unique = values => [...new Map(values.map(value => [`${value.scope}:${value.file}:${value.kind}`, value])).values()];
const result = {
  tracked: unique(current),
  history: unique(history),
  trackedEnvironmentFiles: tracked.filter(file => file === ".env" || file.startsWith(".env.")),
};
console.log(JSON.stringify(result, null, 2));
if (result.tracked.length > 0) process.exitCode = 1;
