import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, saveLocalCalculationLog } from "@/lib/storage";

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
  try {
    const input = calculationLogSchema.parse(await request.json());
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    if (!isSupabaseConfigured()) {
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
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("calculation_logs").insert({
      id,
      user_id: null,
      project_id: input.projectId ?? null,
      calculator_type: input.calculatorType,
      input_json: input.inputJson,
      result_json: input.resultJson,
      formula: input.formula,
      explanation: input.explanation
    });

    if (error) {
      console.error("BindLab calculation persistence failed", { requestId, code: error.code });
      return NextResponse.json({ error: "The calculation could not be saved. Please try again.", requestId }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch (error) {
    console.error("BindLab calculation log request failed", { requestId, category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "The calculation could not be saved. Please try again.", requestId }, { status: 500 });
  }
}
