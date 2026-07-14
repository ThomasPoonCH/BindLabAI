import { NextResponse } from "next/server";
import { z } from "zod";
import { generateGeminiJson } from "@/lib/ai/gemini";
import { AiServiceError } from "@/lib/ai/service-error";

const geminiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required."),
  modelName: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional()
});

export async function POST(request: Request) {
  try {
    const input = geminiRequestSchema.parse(await request.json());
    const generation = await generateGeminiJson(input);
    return NextResponse.json({ text: generation.text, metadata: generation.metadata });
  } catch (error) {
    if (error instanceof AiServiceError) return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
    return NextResponse.json({ error: { code: "UNKNOWN_ERROR", message: "The AI request failed." } }, { status: 500 });
  }
}
