import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { experimentSchema } from "@/lib/ai/experiment-schema";

const updateExperimentSchema = experimentSchema.partial().omit({
  experimentId: true,
  createdAt: true,
});

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase configuration: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from("experiments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Experiment not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: { code: "UNKNOWN_ERROR", message: "Failed to fetch experiment" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // Validate update payload (partial schema)
    const validated = updateExperimentSchema.parse(body);

    // Map TypeScript field names to database column names
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.title !== undefined) update.title = validated.title;
    if (validated.objective !== undefined) update.objective = validated.objective;
    if (validated.reactionType !== undefined)
      update.reaction_type = validated.reactionType;
    if (validated.experimentStatus !== undefined)
      update.experiment_status = validated.experimentStatus;
    if (validated.conditions !== undefined)
      update.conditions = validated.conditions;
    if (validated.reagents !== undefined) update.reagents = validated.reagents;
    if (validated.workup !== undefined) update.workup = validated.workup;
    if (validated.purification !== undefined)
      update.purification = validated.purification;
    if (validated.analyticalMethods !== undefined)
      update.analytical_methods = validated.analyticalMethods;
    if (validated.expectedProduct !== undefined)
      update.expected_product = validated.expectedProduct;
    if (validated.expectedMolecularWeight !== undefined)
      update.expected_molecular_weight = validated.expectedMolecularWeight;
    if (validated.notes !== undefined) update.notes = validated.notes;
    if (validated.safetyNotes !== undefined)
      update.safety_notes = validated.safetyNotes;
    if (validated.missingInformation !== undefined)
      update.missing_information = validated.missingInformation;
    if (validated.conflicts !== undefined) update.conflicts = validated.conflicts;
    if (validated.assumptions !== undefined)
      update.assumptions = validated.assumptions;
    if (validated.warnings !== undefined) update.warnings = validated.warnings;
    if (validated.aiSummary !== undefined) update.ai_summary = validated.aiSummary;

    const { data, error } = await supabase
      .from("experiments")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: "DATABASE_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: "UNKNOWN_ERROR", message: "Failed to update experiment" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from("experiments")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: { code: "DATABASE_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "UNKNOWN_ERROR", message: "Failed to delete experiment" } },
      { status: 500 }
    );
  }
}
