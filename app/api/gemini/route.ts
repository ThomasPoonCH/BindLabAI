import { NextResponse } from "next/server";
import { z } from "zod";
import { generateGeminiJson } from "@/lib/ai/gemini";
import { AiServiceError } from "@/lib/ai/service-error";
import { MalformedJsonError, publicError, readJsonWithLimit, rejectUntrustedOrigin, requestId, RequestLimitError, UnsupportedContentTypeError } from "@/lib/security/http";
import { rateLimit } from "@/lib/security/rate-limit";
import { acquireConcurrencySlot } from "@/lib/security/concurrency-limit";

const geminiRequestSchema = z.object({
  prompt: z.string().trim().min(1, "Prompt is required.").max(12_000),
  temperature: z.number().min(0).max(1).optional()
}).strict();

export async function POST(request: Request) {
  const id = requestId();
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;
  try {
    const limit = await rateLimit(request, { prefix: "gemini", limit: 5, windowSeconds: 60 });
    if (!limit.configured && process.env.NODE_ENV === "production") return publicError(503, "RATE_LIMIT_NOT_CONFIGURED", "AI generation is temporarily unavailable.", id);
    if (!limit.allowed) {
      const response = publicError(429, "RATE_LIMITED", "Too many AI requests. Please wait and try again.", id);
      response.headers.set("Retry-After", String(limit.retryAfterSeconds));
      return response;
    }
    const input = geminiRequestSchema.parse(await readJsonWithLimit(request, 32_000));
    const release = acquireConcurrencySlot("gemini", 2);
    if (!release) return publicError(429, "AI_BUSY", "AI generation is busy. Please wait and try again.", id);
    try {
      const generation = await generateGeminiJson(input);
      return NextResponse.json({ text: generation.text.slice(0, 64_000), metadata: generation.metadata }, { headers: { "Cache-Control": "no-store, private" } });
    } finally {
      release();
    }
  } catch (error) {
    if (error instanceof AiServiceError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    if (error instanceof z.ZodError) return publicError(400, "INVALID_REQUEST", "The AI request is invalid.", id);
    if (error instanceof UnsupportedContentTypeError) return publicError(415, "UNSUPPORTED_MEDIA_TYPE", "Send the AI request as JSON.", id);
    if (error instanceof MalformedJsonError) return publicError(400, "MALFORMED_JSON", "The JSON request is malformed.", id);
    if (error instanceof RequestLimitError) return publicError(413, "REQUEST_TOO_LARGE", "The AI request is too large.", id);
    console.error("Gemini request failed", { requestId: id, category: error instanceof Error ? error.name : "unknown" });
    return publicError(500, "AI_REQUEST_FAILED", "The AI request failed.", id);
  }
}
