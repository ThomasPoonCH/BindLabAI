import { z } from "zod";
export const feedbackSchema = z.object({
  id: z.string().uuid(), category: z.enum(["Bug", "Calculation error", "AI accuracy", "Feature request", "General feedback"]), description: z.string().trim().min(5).max(5000),
  feature: z.enum(["Experiment builder", "Calculators", "LC-MS/HPLC", "Records / export", "Live Bench", "Other"]),
  contact: z.union([z.string().trim().email().max(254), z.literal("")]).default(""), role: z.string().trim().max(100).default(""), rating: z.number().int().min(1).max(5).nullable().default(null), website: z.literal("").default(""),
}).strict();
export type ResearcherFeedback = z.infer<typeof feedbackSchema>;
export function feedbackEmail(feedback: ResearcherFeedback, address: string) {
  if (!z.string().email().safeParse(address).success) return null;
  const body = `Category: ${feedback.category}\nFeature: ${feedback.feature}\nRole: ${feedback.role}\nUsefulness: ${feedback.rating ?? "Not provided"}\nContact: ${feedback.contact}\n\n${feedback.description}`;
  return `mailto:${encodeURIComponent(address)}?subject=${encodeURIComponent(`BindLab beta: ${feedback.category}`)}&body=${encodeURIComponent(body)}`;
}
