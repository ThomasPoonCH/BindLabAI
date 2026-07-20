import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";

const developmentOrigins = new Set(["http://localhost:3003", "http://127.0.0.1:3003"]);

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
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && origin === configured) return true;
  if (process.env.NODE_ENV !== "production" && developmentOrigins.has(origin)) return true;
  return false;
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
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new RequestLimitError();
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new RequestLimitError();
  return JSON.parse(text) as unknown;
}

export class RequestLimitError extends Error {
  constructor() {
    super("Request body is too large");
    this.name = "RequestLimitError";
  }
}
