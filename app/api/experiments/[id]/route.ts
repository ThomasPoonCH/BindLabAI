import { NextResponse } from "next/server";
import { z } from "zod";
import { experimentSchema } from "@/lib/ai/experiment-schema";
import { publicError, readJsonWithLimit, rejectUntrustedOrigin, requestId, RequestLimitError } from "@/lib/security/http";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

const idSchema = z.string().uuid();
const updateExperimentSchema = experimentSchema.partial().omit({ experimentId: true, createdAt: true }).strict();
type Context = { params: Promise<{ id: string }> };

async function authorizedContext(context: Context, requestIdValue: string) {
  const parsedId = idSchema.safeParse((await context.params).id);
  if (!parsedId.success) return { response: publicError(404, "NOT_FOUND", "Experiment not found.", requestIdValue) };
  const { supabase, user } = await requireAuthenticatedUser();
  if (!user) return { response: publicError(401, "AUTHENTICATION_REQUIRED", "Sign in to access secure cloud experiments.", requestIdValue) };
  return { supabase, user, id: parsedId.data };
}

export async function GET(_: Request, context: Context) {
  const requestIdValue = requestId();
  try {
    const auth = await authorizedContext(context, requestIdValue);
    if ("response" in auth) return auth.response;
    const { data, error } = await auth.supabase.from("experiments").select("*").eq("id", auth.id).eq("user_id", auth.user.id).maybeSingle();
    if (error) {
      console.error("Cloud experiment fetch failed", { requestId: requestIdValue, code: error.code });
      return publicError(500, "DATABASE_ERROR", "The experiment could not be loaded.", requestIdValue);
    }
    if (!data) return publicError(404, "NOT_FOUND", "Experiment not found.", requestIdValue);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Cloud experiment fetch failed", { requestId: requestIdValue, category: error instanceof Error ? error.name : "unknown" });
    return publicError(503, "CLOUD_STORAGE_UNAVAILABLE", "Secure cloud storage is currently unavailable.", requestIdValue);
  }
}

export async function PATCH(request: Request, context: Context) {
  const requestIdValue = requestId();
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;
  try {
    const auth = await authorizedContext(context, requestIdValue);
    if ("response" in auth) return auth.response;
    const value = updateExperimentSchema.parse(await readJsonWithLimit(request, 256_000));
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields: Array<[keyof typeof value, string]> = [
      ["title", "title"], ["objective", "objective"], ["reactionType", "reaction_type"],
      ["experimentStatus", "experiment_status"], ["originalInstruction", "original_instruction"],
      ["conditions", "conditions"], ["reagents", "reagents"], ["workup", "workup"],
      ["purification", "purification"], ["analyticalMethods", "analytical_methods"],
      ["expectedProduct", "expected_product"], ["expectedMolecularWeight", "expected_molecular_weight"],
      ["notes", "notes"], ["safetyNotes", "safety_notes"], ["missingInformation", "missing_information"],
      ["conflicts", "conflicts"], ["assumptions", "assumptions"], ["warnings", "warnings"], ["aiSummary", "ai_summary"],
    ];
    for (const [source, target] of fields) if (value[source] !== undefined) update[target] = value[source];
    const { data, error } = await auth.supabase.from("experiments").update(update).eq("id", auth.id).eq("user_id", auth.user.id).select().maybeSingle();
    if (error) {
      console.error("Cloud experiment update failed", { requestId: requestIdValue, code: error.code });
      return publicError(500, "DATABASE_ERROR", "The experiment could not be updated.", requestIdValue);
    }
    if (!data) return publicError(404, "NOT_FOUND", "Experiment not found.", requestIdValue);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    if (error instanceof z.ZodError) return publicError(400, "VALIDATION_ERROR", "The experiment update is invalid.", requestIdValue);
    if (error instanceof RequestLimitError) return publicError(413, "REQUEST_TOO_LARGE", "The experiment update is too large.", requestIdValue);
    console.error("Cloud experiment update failed", { requestId: requestIdValue, category: error instanceof Error ? error.name : "unknown" });
    return publicError(503, "CLOUD_STORAGE_UNAVAILABLE", "Secure cloud storage is currently unavailable.", requestIdValue);
  }
}

export async function DELETE(request: Request, context: Context) {
  const requestIdValue = requestId();
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;
  try {
    const auth = await authorizedContext(context, requestIdValue);
    if ("response" in auth) return auth.response;
    const { data, error } = await auth.supabase.from("experiments").delete().eq("id", auth.id).eq("user_id", auth.user.id).select("id").maybeSingle();
    if (error) {
      console.error("Cloud experiment delete failed", { requestId: requestIdValue, code: error.code });
      return publicError(500, "DATABASE_ERROR", "The experiment could not be deleted.", requestIdValue);
    }
    if (!data) return publicError(404, "NOT_FOUND", "Experiment not found.", requestIdValue);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Cloud experiment delete failed", { requestId: requestIdValue, category: error instanceof Error ? error.name : "unknown" });
    return publicError(503, "CLOUD_STORAGE_UNAVAILABLE", "Secure cloud storage is currently unavailable.", requestIdValue);
  }
}
