import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { generateLabPrepGuide } from "@/lib/ai/providers";
import { getLocalProject, isSupabaseConfigured, saveLocalGeneration } from "@/lib/storage";
import { formatAiError } from "@/lib/ai/errors";
import { publicError, rejectUntrustedOrigin } from "@/lib/security/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = randomUUID();
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;
  if (process.env.NODE_ENV === "production") {
    return publicError(503, "LEGACY_ROUTE_DISABLED", "This legacy cloud workflow is not available in the public prototype.", requestId);
  }
  try {
    const { id } = await params;
    if (isSupabaseConfigured()) {
      return publicError(503, "LEGACY_ROUTE_DISABLED", "Cloud regeneration requires authenticated ownership and is not enabled.", requestId);
    }
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
  } catch (error) {
    console.error("BindLab regeneration request failed", { requestId, category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: formatAiError(error), requestId }, { status: 500 });
  }
}
