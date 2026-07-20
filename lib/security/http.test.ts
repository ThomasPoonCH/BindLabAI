import { afterEach, describe, expect, it, vi } from "vitest";
import { isTrustedBrowserOrigin, normalizeOrigin, trustedBrowserOrigins } from "./http";

const productionOrigin = "https://bindlabaihk.vercel.app";
const previewOrigin = "https://bindlabai-git-security-thomas-projects.vercel.app";

function request(origin?: string, extraHeaders: HeadersInit = {}) {
  const headers = new Headers(extraHeaders);
  if (origin !== undefined) headers.set("Origin", origin);
  return new Request("https://server.invalid/api/gemini", { method: "POST", headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("normalizeOrigin", () => {
  it("normalizes a trailing slash and VERCEL_URL without a protocol", () => {
    expect(normalizeOrigin(`${productionOrigin}/`)).toBe(productionOrigin);
    expect(normalizeOrigin("preview.example.vercel.app", true)).toBe("https://preview.example.vercel.app");
  });

  it("rejects malformed origins and origin-like URLs with extra components", () => {
    expect(normalizeOrigin("not an origin")).toBeNull();
    expect(normalizeOrigin("javascript:alert(1)")).toBeNull();
    expect(normalizeOrigin(`${productionOrigin}/api`)).toBeNull();
    expect(normalizeOrigin(`https://user:pass@bindlabaihk.vercel.app`)).toBeNull();
  });
});

describe("trusted browser origins", () => {
  it("accepts only the production origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_URL", "bindlabai-random.vercel.app");
    expect(trustedBrowserOrigins()).toEqual(new Set([productionOrigin]));
    expect(isTrustedBrowserOrigin(request(productionOrigin))).toBe(true);
    expect(isTrustedBrowserOrigin(request(previewOrigin))).toBe(false);
  });

  it("accepts the production origin and exact current preview origin in Preview", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", previewOrigin.replace("https://", ""));
    expect(isTrustedBrowserOrigin(request(previewOrigin))).toBe(true);
    expect(isTrustedBrowserOrigin(request(`${previewOrigin}/`))).toBe(true);
    expect(isTrustedBrowserOrigin(request(productionOrigin))).toBe(true);
  });

  it("rejects unrelated Vercel origins and attacker lookalikes", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", previewOrigin);
    expect(isTrustedBrowserOrigin(request("https://unrelated.vercel.app"))).toBe(false);
    expect(isTrustedBrowserOrigin(request(`${previewOrigin}.attacker.example`))).toBe(false);
    expect(isTrustedBrowserOrigin(request("https://bindlabaihk.vercel.app.attacker.example"))).toBe(false);
  });

  it("rejects malformed and browser-originated requests with a missing Origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isTrustedBrowserOrigin(request("https://[invalid"))).toBe(false);
    expect(isTrustedBrowserOrigin(request(undefined, { "Sec-Fetch-Site": "same-origin", "User-Agent": "Mozilla/5.0" }))).toBe(false);
  });

  it("allows a non-browser server-side request with no Origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isTrustedBrowserOrigin(request(undefined, { "User-Agent": "BindLab-Server/1.0" }))).toBe(true);
  });
});
