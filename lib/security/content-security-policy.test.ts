import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
async function headersFor(environment: string) {
  vi.resetModules(); vi.stubEnv("NODE_ENV", environment);
  const { default: config } = await import("../../next.config");
  const rules = await config.headers!();
  return rules.find(rule => rule.source === "/:path*")!.headers;
}
describe("browser asset transport policy", () => {
  it("does not upgrade HTTP development assets to HTTPS in Safari", async () => {
    const headers = await headersFor("development"); const csp = headers.find(header => header.key === "Content-Security-Policy")!.value;
    expect(csp).not.toContain("upgrade-insecure-requests"); expect(csp).toContain("default-src 'self'");
    expect(headers.some(header => header.key === "Strict-Transport-Security")).toBe(false);
  });
  it("retains HTTPS enforcement and production script restrictions", async () => {
    const headers = await headersFor("production"); const csp = headers.find(header => header.key === "Content-Security-Policy")!.value;
    expect(csp).toContain("upgrade-insecure-requests"); expect(csp).not.toContain("unsafe-eval");
    expect(headers.find(header => header.key === "Strict-Transport-Security")?.value).toContain("max-age=31536000");
  });
});
