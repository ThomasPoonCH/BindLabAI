import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";

const developmentOrigins = new Set(["http://localhost:3003", "http://127.0.0.1:3003"]);
const productionOrigin = "https://bindlabaihk.vercel.app";

export function normalizeOrigin(value: string | undefined, addHttps = false): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const candidate = addHttps && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function trustedBrowserOrigins(): ReadonlySet<string> {
  const trusted = new Set<string>([productionOrigin]);
  if (process.env.VERCEL_ENV === "preview") {
    const previewOrigin = normalizeOrigin(process.env.VERCEL_URL, true);
    if (previewOrigin) trusted.add(previewOrigin);
  }
  if (process.env.NODE_ENV !== "production") {
    for (const origin of developmentOrigins) trusted.add(origin);
  }
  return trusted;
}

function isBrowserRequestWithoutOrigin(request: Request): boolean {
  if (request.headers.has("sec-fetch-site")) return true;
  return /\b(Mozilla|Chrome|Chromium|Safari|Firefox|Edg)\b/i.test(request.headers.get("user-agent") ?? "");
}

export function requestId(): string {
  return randomUUID();
}

export function publicError(status: number, code: string, message: string, id = requestId()) {
  return NextResponse.json(
    { error: { code, message, requestId: id } },
    { status, headers: { "Cache-Control": "no-store, private" } },
  );
}

export function isTrustedBrowserOrigin(request: Request) {
  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin) return !isBrowserRequestWithoutOrigin(request);
  const origin = normalizeOrigin(suppliedOrigin);
  return origin !== null && trustedBrowserOrigins().has(origin);
}

export function rejectUntrustedOrigin(request: Request) {
  return isTrustedBrowserOrigin(request)
    ? null
    : publicError(403, "ORIGIN_REJECTED", "This request origin is not allowed.");
}

export function privacyPreservingClientId(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT || process.env.GEMINI_API_KEY || "bindlab-development";
  return createHash("sha256").update(`${salt}:${address}`).digest("hex").slice(0, 32);
}

export async function readJsonWithLimit(request: Request, maxBytes: number) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") throw new UnsupportedContentTypeError();
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new RequestLimitError();
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new RequestLimitError();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new MalformedJsonError();
  }
}

export class RequestLimitError extends Error {
  constructor() {
    super("Request body is too large");
    this.name = "RequestLimitError";
  }
}

export class UnsupportedContentTypeError extends Error {
  constructor() {
    super("JSON content type is required");
    this.name = "UnsupportedContentTypeError";
  }
}

export class MalformedJsonError extends Error {
  constructor() {
    super("Request body is not valid JSON");
    this.name = "MalformedJsonError";
  }
}
