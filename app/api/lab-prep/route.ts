import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { generateLabPrepGuide } from "@/lib/ai/providers";
import { labPrepInputSchema } from "@/lib/ai/types";
import { isSupabaseConfigured, saveLocalGeneration, saveLocalProject } from "@/lib/storage";
import { formatAiError } from "@/lib/ai/errors";
import { publicError, rejectUntrustedOrigin } from "@/lib/security/http";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const originError = rejectUntrustedOrigin(request);
  if (originError) return originError;
  if (process.env.NODE_ENV === "production") {
    return publicError(503, "LEGACY_ROUTE_DISABLED", "This legacy cloud workflow is not available in the public prototype.", requestId);
  }
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

    if (isSupabaseConfigured()) {
      return publicError(503, "LEGACY_ROUTE_DISABLED", "Cloud lab-preparation storage requires authenticated ownership and is not enabled.", requestId);
    }
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
  } catch (error) {
    console.error("BindLab lab-prep request failed", { requestId, category: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: formatAiError(error), requestId }, { status: 500 });
  }
}
