const base = process.env.SECURITY_TEST_BASE_URL || "http://127.0.0.1:3011";
let failures = 0;
const rateTestAddress = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

async function check(name, path, expectedStatus, init = {}) {
  const response = await fetch(`${base}${path}`, init);
  let body = {};
  try { body = await response.json(); } catch { /* Status is authoritative. */ }
  const code = body?.error?.code ?? body?.code ?? null;
  const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  const passed = expected.includes(response.status);
  if (!passed) failures += 1;
  console.log(JSON.stringify({ name, status: response.status, expectedStatus, code, passed }));
}

await check("anonymous experiment list", "/api/experiments", [401, 503]);
await check("anonymous guessed experiment", "/api/experiments/00000000-0000-4000-8000-000000000000", [401, 503]);
await check("client user_id does not grant ownership", "/api/experiments", [401, 503], {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: "00000000-0000-4000-8000-000000000000" }),
});
await check("browser model override rejected", "/api/gemini", 400, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "test", modelName: "unexpected-model" }),
});
await check("oversized AI request", "/api/gemini", 413, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "x".repeat(33_000) }),
});
await check("incorrect PDF MIME", "/api/ai/pdf-extract", 415, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
await check("untrusted browser origin", "/api/gemini", 403, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://malicious.example" },
  body: JSON.stringify({ prompt: "test" }),
});
await check("unsupported AI method", "/api/gemini", 405);

for (let attempt = 1; attempt <= 6; attempt += 1) {
  await check(`rate-limit attempt ${attempt}`, "/api/gemini", attempt <= 5 ? 400 : 429, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": rateTestAddress },
    body: JSON.stringify({ prompt: "test", modelName: "unexpected-model" }),
  });
}

if (failures) {
  console.error(`${failures} security route checks failed.`);
  process.exit(1);
}
