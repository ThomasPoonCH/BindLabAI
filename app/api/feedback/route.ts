import { NextResponse } from "next/server";
import { z } from "zod";
import { feedbackSchema } from "@/lib/feedback";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/security/rate-limit";
import { publicError, readJsonWithLimit, rejectUntrustedOrigin, requestId, RequestLimitError, MalformedJsonError, UnsupportedContentTypeError } from "@/lib/security/http";

export async function POST(request: Request) {
  const id = requestId(); const rejected = rejectUntrustedOrigin(request); if (rejected) return rejected;
  try {
    const limit = await rateLimit(request, { prefix: "beta-feedback", limit: 5, windowSeconds: 600 });
    if (process.env.NODE_ENV === "production" && !limit.configured) return publicError(503, "FEEDBACK_UNAVAILABLE", "Feedback delivery is unavailable. Download your feedback or use the configured email option.", id);
    if (!limit.allowed) return publicError(429, "RATE_LIMITED", "Too many submissions. Please wait before retrying.", id);
    const feedback = feedbackSchema.parse(await readJsonWithLimit(request, 20_000));
    if (process.env.FEEDBACK_STORAGE_ENABLED !== "true") return publicError(503, "FEEDBACK_UNAVAILABLE", "Feedback delivery is not configured. Your text has been preserved; download it to share with your coordinator.", id);
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("beta_feedback").insert({ id: feedback.id, category: feedback.category, description: feedback.description, feature: feedback.feature, contact: feedback.contact || null, researcher_role: feedback.role || null, usefulness_rating: feedback.rating });
    if (error && error.code !== "23505") return publicError(503, "FEEDBACK_FAILED", "Feedback was not delivered. Your text is preserved; please retry or download it.", id);
    return NextResponse.json({ ok: true, receipt: feedback.id }, { status: 201, headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof MalformedJsonError) return publicError(400, "INVALID_FEEDBACK", "Please provide a category, feature, description of 5–5000 characters, and a valid optional email.", id);
    if (error instanceof RequestLimitError) return publicError(413, "FEEDBACK_TOO_LARGE", "Feedback is too large. Use 5000 characters or fewer.", id);
    if (error instanceof UnsupportedContentTypeError) return publicError(415, "INVALID_CONTENT_TYPE", "Please submit feedback through the form.", id);
    return publicError(503, "FEEDBACK_FAILED", "Feedback was not delivered. Your text is preserved; retry or download it.", id);
  }
}
