import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { experimentSchema, type ExperimentRecord } from "@/lib/ai/experiment-schema";

const createExperimentSchema = experimentSchema.omit({
  experimentId: true,
  createdAt: true,
  updatedAt: true,
});

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const validated = createExperimentSchema.parse(body);

    // Generate experiment ID
    const experimentId = crypto.randomUUID();
    const now = new Date().toISOString();

    const record = {
      id: experimentId,
      user_id: null, // For MVP single-user demo
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
    };

    const { data, error } = await supabase
      .from("experiments")
      .insert([record])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: "DATABASE_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { experimentId: data.id, ...data },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: "UNKNOWN_ERROR", message: "Failed to create experiment" } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("experiments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: "DATABASE_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ experiments: data });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "UNKNOWN_ERROR", message: "Failed to list experiments" } },
      { status: 500 }
    );
  }
}
