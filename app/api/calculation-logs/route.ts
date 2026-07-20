import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured, saveLocalCalculationLog } from "@/lib/storage";
import { publicError, rejectUntrustedOrigin } from "@/lib/security/http";

const calculationLogSchema = z.object({
  projectId: z.string().uuid().nullable().optional(),
  calculatorType: z.string().min(1),
  inputJson: z.unknown(),
  resultJson: z.unknown(),
  formula: z.string().optional(),
  explanation: z.string().optional()
});

export async function POST(request: Request) {
  const requestId = randomUUID();
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;
  if (process.env.NODE_ENV === "production") {
    return publicError(503, "CLOUD_PERSISTENCE_DISABLED", "Cloud calculation-log storage is not enabled for the public prototype.", requestId);
  }
  try {
    const input = calculationLogSchema.parse(await request.json());
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    if (isSupabaseConfigured()) {
      return publicError(503, "LEGACY_ROUTE_DISABLED", "Cloud calculation-log storage requires authenticated ownership and is not enabled.", requestId);
    }
    await saveLocalCalculationLog({
      id,
      project_id: input.projectId ?? null,
      calculator_type: input.calculatorType,
      input_json: input.inputJson,
      result_json: input.resultJson,
      formula: input.formula,
      explanation: input.explanation,
      created_at: createdAt
    });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("BindLab calculation log request failed", { requestId, category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "The calculation could not be saved. Please try again.", requestId }, { status: 500 });
  }
}
