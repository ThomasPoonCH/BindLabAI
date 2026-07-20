const base = process.env.SECURITY_TEST_BASE_URL || "http://127.0.0.1:3010";
const checks = [
  ["internal funding route", "/dashboard/funding", 404, {}],
  ["legacy project intake", "/dashboard/new", 404, {}],
  ["legacy project detail", "/dashboard/project/00000000-0000-4000-8000-000000000000", 404, {}],
  ["anonymous experiment list", "/api/experiments", 503, {}],
  ["legacy persistence API", "/api/lab-prep", 503, { method: "POST" }],
  ["AI fails closed without shared limiter", "/api/gemini", 503, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "test" }),
  }],
];
let failures = 0;
const homepage = await fetch(base);
const requiredHeaders = [
  "content-security-policy",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "strict-transport-security",
];
for (const header of requiredHeaders) {
  const passed = Boolean(homepage.headers.get(header));
  if (!passed) failures += 1;
  console.log(JSON.stringify({ name: `security header ${header}`, passed }));
}
for (const [name, path, expectedStatus, init] of checks) {
  const response = await fetch(`${base}${path}`, init);
  const passed = response.status === expectedStatus;
  if (!passed) failures += 1;
  console.log(JSON.stringify({ name, status: response.status, expectedStatus, passed }));
}
if (failures) process.exit(1);
