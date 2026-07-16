import { z } from "zod";

export const compactExtractionSchema = z.object({
  documentTitle: z.string().nullable().default(null), objective: z.string().nullable().default(null),
  reagents: z.array(z.object({ nameAsWritten: z.string().nullable().default(null), quantityAsWritten: z.string().nullable().default(null), roleAsWritten: z.string().nullable().default(null), pageNumber: z.number().int().positive().nullable().default(null), sourceType: z.enum(["pdf_text", "pdf_image", "user_instruction", "ai_interpreted"]).default("ai_interpreted") })).default([]),
  conditions: z.object({ solventAsWritten: z.string().nullable().default(null), temperatureAsWritten: z.string().nullable().default(null), timeAsWritten: z.string().nullable().default(null), atmosphereAsWritten: z.string().nullable().default(null) }).default({}),
  procedureSteps: z.array(z.string()).default([]), workupSteps: z.array(z.string()).default([]), purificationSteps: z.array(z.string()).default([]), analysisSteps: z.array(z.string()).default([]),
  visualFindings: z.array(z.object({ pageNumber: z.number().int().positive().nullable().default(null), type: z.string(), description: z.string(), confidence: z.number().min(0).max(1).default(0), requiresManualConfirmation: z.boolean().default(true) })).default([]),
  missingInformation: z.array(z.string()).default([]), warnings: z.array(z.string()).default([])
});
