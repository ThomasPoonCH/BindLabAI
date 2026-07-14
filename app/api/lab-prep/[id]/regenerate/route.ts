import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { generateLabPrepGuide } from "@/lib/ai/providers";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getLocalProject, isSupabaseConfigured, saveLocalGeneration } from "@/lib/storage";
import { formatAiError } from "@/lib/ai/errors";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = randomUUID();
  try {
    const { id } = await params;
    if (!isSupabaseConfigured()) {
      const project = await getLocalProject(id);

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const generation = await generateLabPrepGuide({
        title: project.title,
        subjectArea: project.subject_area,
        userLevel: project.user_level,
        preferredLanguage: project.preferred_language,
        rawInput: project.raw_input
      });

      await saveLocalGeneration({
        id: randomUUID(),
        project_id: id,
        model_provider: generation.provider,
        model_name: generation.model,
        prompt: generation.prompt,
        output_json: generation.output,
        created_at: new Date().toISOString()
      });

      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceSupabaseClient();
    const { data: project, error } = await supabase.from("projects").select("*").eq("id", id).single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const generation = await generateLabPrepGuide({
      title: project.title,
      subjectArea: project.subject_area,
      userLevel: project.user_level,
      preferredLanguage: project.preferred_language,
      rawInput: project.raw_input
    });

    const { error: insertError } = await supabase.from("generations").insert({
      id: randomUUID(),
      project_id: id,
      user_id: project.user_id,
      model_provider: generation.provider,
      model_name: generation.model,
      prompt: generation.prompt,
      output_json: generation.output
    });

    if (insertError) {
      console.error("BindLab regeneration persistence failed", { requestId, code: insertError.code });
      return NextResponse.json({ error: "The regenerated record could not be saved. Please try again.", requestId }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("BindLab regeneration request failed", { requestId, category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: formatAiError(error), requestId }, { status: 500 });
  }
}
