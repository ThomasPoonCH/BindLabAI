import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/rate-limit", () => ({
  rateLimit: vi.fn(async () => ({ allowed: true, remaining: 3, retryAfterSeconds: 60, configured: true })),
}));

import { POST as extractPdf } from "../../app/api/ai/pdf-extract/route";
import { POST as buildExperiment } from "../../app/api/ai/experiment-builder/route";

const previewOrigin = "https://bindlabai-git-security-thomas-projects.vercel.app";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("VERCEL_URL", previewOrigin.replace("https://", ""));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI route Preview origin verification", () => {
  it("allows the exact Preview origin through the PDF route origin check", async () => {
    const response = await extractPdf(new Request(`${previewOrigin}/api/ai/pdf-extract`, {
      method: "POST",
      headers: { Origin: previewOrigin, "Content-Type": "application/json" },
      body: "{}",
    }));
    expect(response.status).toBe(415);
  });

  it("allows the exact Preview origin through the experiment-builder origin check", async () => {
    const response = await buildExperiment(new Request(`${previewOrigin}/api/ai/experiment-builder`, {
      method: "POST",
      headers: { Origin: previewOrigin, "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: "" }),
    }));
    expect(response.status).not.toBe(403);
    expect(response.status).toBe(400);
  });

  it.each([
    ["PDF extraction", extractPdf, "/api/ai/pdf-extract"],
    ["experiment builder", buildExperiment, "/api/ai/experiment-builder"],
  ])("rejects an unrelated Vercel origin for %s", async (_name, handler, path) => {
    const response = await handler(new Request(`${previewOrigin}${path}`, {
      method: "POST",
      headers: { Origin: "https://unrelated.vercel.app", "Content-Type": "application/json" },
      body: "{}",
    }));
    expect(response.status).toBe(403);
  });
});
