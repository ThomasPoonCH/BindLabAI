import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { insert, limiter } = vi.hoisted(() => ({ insert: vi.fn(), limiter: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServiceSupabaseClient: () => ({ from: () => ({ insert }) }) }));
vi.mock("@/lib/security/rate-limit", () => ({ rateLimit: limiter }));
import { POST } from "@/app/api/feedback/route";
const feedback = { id: "11111111-1111-4111-8111-111111111111", category: "Bug", feature: "Experiment builder", description: "Synthetic test feedback only" };
const request = (body: unknown = feedback, origin = "http://localhost:3003") => new Request("http://localhost:3003/api/feedback", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) });
beforeEach(() => { vi.stubEnv("NODE_ENV", "test"); vi.stubEnv("FEEDBACK_STORAGE_ENABLED", "true"); insert.mockReset().mockResolvedValue({ error: null }); limiter.mockReset().mockResolvedValue({ allowed: true, configured: true }); });
afterEach(() => vi.unstubAllEnvs());
describe("feedback delivery", () => {
  it("acknowledges only a stored submission", async () => { const result = await POST(request()); expect(result.status).toBe(201); expect(await result.json()).toMatchObject({ ok: true, receipt: feedback.id }); expect(insert).toHaveBeenCalledWith(expect.objectContaining({ contact: null, researcher_role: null })); });
  it("reports missing configuration honestly", async () => { vi.stubEnv("FEEDBACK_STORAGE_ENABLED", "false"); expect((await POST(request())).status).toBe(503); expect(insert).not.toHaveBeenCalled(); });
  it("does not claim delivery after a database error", async () => { insert.mockResolvedValue({ error: { code: "failure" } }); expect((await POST(request())).status).toBe(503); });
  it("safely acknowledges a retry of an existing receipt", async () => { insert.mockResolvedValue({ error: { code: "23505" } }); expect((await POST(request())).status).toBe(201); });
  it.each([{ ...feedback, website: "spam" }, { ...feedback, description: "x" }, { ...feedback, contact: "invalid" }, { ...feedback, experiment: "confidential" }])("rejects invalid or unexpected data", async data => { expect((await POST(request(data))).status).toBe(400); expect(insert).not.toHaveBeenCalled(); });
  it("rejects foreign origins", async () => { expect((await POST(request(feedback, "https://unrelated.example"))).status).toBe(403); });
  it("rate limits submissions", async () => { limiter.mockResolvedValue({ allowed: false, configured: true }); expect((await POST(request())).status).toBe(429); expect(insert).not.toHaveBeenCalled(); });
});
