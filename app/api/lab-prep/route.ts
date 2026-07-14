import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { generateLabPrepGuide } from "@/lib/ai/providers";
import { labPrepInputSchema } from "@/lib/ai/types";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, saveLocalGeneration, saveLocalProject } from "@/lib/storage";
import { formatAiError } from "@/lib/ai/errors";

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const formData = await request.formData();
    const input = labPrepInputSchema.parse({
      title: formData.get("title"),
      subjectArea: formData.get("subjectArea"),
      userLevel: formData.get("userLevel"),
      preferredLanguage: formData.get("preferredLanguage"),
      rawInput: formData.get("rawInput")
    });

    const projectId = randomUUID();
    const generationId = randomUUID();
    const generation = await generateLabPrepGuide(input);

    if (!isSupabaseConfigured()) {
      await saveLocalProject(input, projectId);
      await saveLocalGeneration({
        id: generationId,
        project_id: projectId,
        model_provider: generation.provider,
        model_name: generation.model,
        prompt: generation.prompt,
        output_json: generation.output,
        created_at: new Date().toISOString()
      });

      return NextResponse.json({ projectId });
    }

    const supabase = createServiceSupabaseClient();

    const { error: projectError } = await supabase.from("projects").insert({
      id: projectId,
      user_id: null,
      title: input.title,
      subject_area: input.subjectArea,
      user_level: input.userLevel,
      preferred_language: input.preferredLanguage,
      raw_input: input.rawInput
    });

    if (projectError) {
      console.error("BindLab project persistence failed", { requestId, code: projectError.code });
      return NextResponse.json({ error: "The experiment could not be saved. Please try again.", requestId }, { status: 500 });
    }

    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      await supabase.from("documents").insert({
        id: randomUUID(),
        user_id: null,
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        storage_path: null,
        extracted_text: null
      });
    }

    const { error: generationError } = await supabase.from("generations").insert({
      id: generationId,
      project_id: projectId,
      user_id: null,
      model_provider: generation.provider,
      model_name: generation.model,
      prompt: generation.prompt,
      output_json: generation.output
    });

    if (generationError) {
      console.error("BindLab generation persistence failed", { requestId, code: generationError.code });
      return NextResponse.json({ error: "The generated record could not be saved. Please try again.", requestId }, { status: 500 });
    }

    return NextResponse.json({ projectId });
  } catch (error) {
    console.error("BindLab lab-prep request failed", { requestId, category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: formatAiError(error), requestId }, { status: 500 });
  }
}
