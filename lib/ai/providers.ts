import "server-only";
import { buildLabPrepPrompt } from "./prompts";
import { labPrepGuideSchema, type LabPrepGuide, type LabPrepInput } from "./types";
import { generateGeminiJson, getGeminiModelName } from "./gemini";

export type GenerationMetadata = {
  provider: "gemini";
  model: string;
  prompt: string;
  output: LabPrepGuide;
};

export async function generateLabPrepGuide(input: LabPrepInput): Promise<GenerationMetadata> {
  const modelName = getGeminiModelName();
  const prompt = buildLabPrepPrompt(input);

  if (!process.env.GEMINI_API_KEY) {
    return {
      provider: "gemini",
      model: "fallback-local-no-api-key",
      prompt,
      output: fallbackGuide(input)
    };
  }

  const generation = await generateGeminiJson({ prompt, modelName, temperature: 0.25 });
  const parsed = JSON.parse(generation.text);
  const output = labPrepGuideSchema.parse(parsed);

  return { provider: "gemini", model: generation.metadata.successfulModel, prompt, output };
}

function fallbackGuide(input: LabPrepInput): LabPrepGuide {
  return {
    experiment_goal: `Prepare for ${input.title} by organizing the provided ${input.subjectArea} material into a beginner-safe workflow.`,
    beginner_explanation: "Gemini is not configured yet, so this local fallback identifies what to review before bench work. Add GEMINI_API_KEY to generate a full AI guide.",
    key_terms: [
      { term: "SOP", simple_explanation: "The official procedure your supervisor or institution requires you to follow." }
    ],
    step_by_step_protocol: [
      {
        step_number: 1,
        action: "Read the provided material and mark every reagent, amount, condition, and instrument setting.",
        beginner_note: "Do not start lab work until all unclear values are confirmed.",
        risk_or_common_mistake: "Guessing a concentration, volume, hazard, or instrument method."
      }
    ],
    reagent_calculation_checklist: [
      {
        item: "Reagent amounts and concentrations",
        formula_or_reasoning: "Use moles = concentration (M) x volume (L), then convert units carefully. Exact calculation requires complete values.",
        status: "needs_confirmation"
      }
    ],
    missing_information: [
      {
        missing_item: "Confirmed supervisor SOP",
        why_it_matters: "AI output cannot replace local safety rules or validated methods.",
        suggested_question: "Can you confirm the exact SOP, reagent amounts, hazards, and instrument settings I should follow?"
      }
    ],
    safety_warnings: [
      {
        warning: "Follow supervisor and institutional SOP.",
        why_it_matters: "Hazards depend on exact reagents, scale, equipment, and local controls.",
        what_to_do: "Confirm PPE, waste handling, ventilation, and emergency procedures before starting."
      }
    ],
    questions_to_ask_supervisor: [
      "Which SOP version should I follow?",
      "Are the reagent amounts, concentrations, and instrument settings complete?",
      "What hazards and waste streams should I prepare for?"
    ],
    lab_notebook_draft: `Title: ${input.title}\nObjective: Prepare for the experiment by reviewing supplied material and confirming missing details.\nNotes: Follow supervisor and institutional SOP.`,
    assumptions: ["GEMINI_API_KEY is not configured, so this is a local fallback output."],
    recommended_calculators: [
      {
        calculator_id: "dilution",
        reason: "Fallback recommendation: use deterministic calculators to verify concentration and volume arithmetic.",
        pre_filled_inputs: {}
      }
    ],
    confidence_notes: "Low confidence until the Gemini API generates a full guide and the supervisor confirms details."
  };
}
