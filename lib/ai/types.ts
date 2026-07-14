import { z } from "zod";

export const labPrepInputSchema = z.object({
  title: z.string().min(1),
  subjectArea: z.string().min(1),
  userLevel: z.string().min(1),
  preferredLanguage: z.string().min(1),
  rawInput: z.string().min(1)
});

export type LabPrepInput = z.infer<typeof labPrepInputSchema>;

export const labPrepGuideSchema = z.object({
  experiment_goal: z.string(),
  beginner_explanation: z.string(),
  key_terms: z.array(z.object({
    term: z.string(),
    simple_explanation: z.string()
  })),
  step_by_step_protocol: z.array(z.object({
    step_number: z.number(),
    action: z.string(),
    beginner_note: z.string(),
    risk_or_common_mistake: z.string()
  })),
  reagent_calculation_checklist: z.array(z.object({
    item: z.string(),
    formula_or_reasoning: z.string(),
    status: z.enum(["known", "missing", "needs_confirmation"])
  })),
  missing_information: z.array(z.object({
    missing_item: z.string(),
    why_it_matters: z.string(),
    suggested_question: z.string()
  })),
  safety_warnings: z.array(z.object({
    warning: z.string(),
    why_it_matters: z.string(),
    what_to_do: z.string()
  })),
  questions_to_ask_supervisor: z.array(z.string()),
  lab_notebook_draft: z.string(),
  assumptions: z.array(z.string()),
  recommended_calculators: z.array(z.object({
    calculator_id: z.string(),
    reason: z.string(),
    pre_filled_inputs: z.record(z.unknown())
  })).default([]),
  confidence_notes: z.string()
});

export type LabPrepGuide = z.infer<typeof labPrepGuideSchema>;
