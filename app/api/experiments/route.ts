import { NextResponse } from "next/server";
import { z } from "zod";
import { experimentSchema } from "@/lib/ai/experiment-schema";
import { publicError, readJsonWithLimit, rejectUntrustedOrigin, requestId, RequestLimitError } from "@/lib/security/http";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

const createExperimentSchema = experimentSchema.omit({
  experimentId: true,
  createdAt: true,
  updatedAt: true,
}).strict();

export async function POST(request: Request) {
  const id = requestId();
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return publicError(401, "AUTHENTICATION_REQUIRED", "Sign in to save an experiment securely.", id);
    const validated = createExperimentSchema.parse(await readJsonWithLimit(request, 256_000));
    const experimentId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { data, error } = await supabase.from("experiments").insert({
      id: experimentId,
      user_id: user.id,
      title: validated.title,
      objective: validated.objective,
      reaction_type: validated.reactionType,
      experiment_status: validated.experimentStatus,
      original_instruction: validated.originalInstruction,
      conditions: validated.conditions,
      reagents: validated.reagents,
      workup: validated.workup,
      purification: validated.purification,
      analytical_methods: validated.analyticalMethods,
      expected_product: validated.expectedProduct,
      expected_molecular_weight: validated.expectedMolecularWeight,
      notes: validated.notes,
      safety_notes: validated.safetyNotes,
      missing_information: validated.missingInformation,
      conflicts: validated.conflicts,
      assumptions: validated.assumptions,
      warnings: validated.warnings,
      ai_summary: validated.aiSummary,
      created_at: now,
      updated_at: now,
    }).select().single();
    if (error || !data) {
      console.error("Cloud experiment create failed", { requestId: id, code: error?.code ?? "no_data" });
      return publicError(500, "DATABASE_ERROR", "The experiment could not be saved securely.", id);
    }
    return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    if (error instanceof z.ZodError) return publicError(400, "VALIDATION_ERROR", "The experiment record is invalid.", id);
    if (error instanceof RequestLimitError) return publicError(413, "REQUEST_TOO_LARGE", "The experiment record is too large.", id);
    console.error("Cloud experiment create failed", { requestId: id, category: error instanceof Error ? error.name : "unknown" });
    return publicError(503, "CLOUD_STORAGE_UNAVAILABLE", "Secure cloud saving is currently unavailable.", id);
  }
}

export async function GET() {
  const id = requestId();
  try {
    const { supabase, user } = await requireAuthenticatedUser();
    if (!user) return publicError(401, "AUTHENTICATION_REQUIRED", "Sign in to view secure cloud experiments.", id);
    const { data, error } = await supabase.from("experiments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) {
      console.error("Cloud experiment list failed", { requestId: id, code: error.code });
      return publicError(500, "DATABASE_ERROR", "Experiments could not be loaded.", id);
    }
    return NextResponse.json({ experiments: data ?? [] }, { headers: { "Cache-Control": "no-store, private" } });
  } catch (error) {
    console.error("Cloud experiment list failed", { requestId: id, category: error instanceof Error ? error.name : "unknown" });
    return publicError(503, "CLOUD_STORAGE_UNAVAILABLE", "Secure cloud saving is currently unavailable.", id);
  }
}
