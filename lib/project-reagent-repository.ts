import { z } from "zod";

const projectReagentSchema = z.object({
  id: z.string(), projectId: z.string().nullable(), name: z.string().min(1), aliases: z.array(z.string()),
  molecularWeight: z.number().positive().nullable(), density: z.number().positive().nullable(),
  physicalForm: z.enum(["solid", "liquid", "stock_solution", "gas", "unknown"]),
  source: z.literal("user_confirmed"), createdAt: z.string(), updatedAt: z.string(),
});
export type ProjectReagent = z.infer<typeof projectReagentSchema>;
const key = "bindlab-project-reagents-v1";

export function parseProjectReagents(value: unknown): ProjectReagent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => { const parsed = projectReagentSchema.safeParse(item); return parsed.success ? [parsed.data] : []; });
}

export function listProjectReagents(): ProjectReagent[] {
  if (typeof window === "undefined") return [];
  try { return parseProjectReagents(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { return []; }
}

export function saveProjectReagent(input: Omit<ProjectReagent, "id" | "createdAt" | "updatedAt" | "source">) {
  const timestamp = new Date().toISOString();
  const record = projectReagentSchema.parse({ ...input, id: crypto.randomUUID(), source: "user_confirmed", createdAt: timestamp, updatedAt: timestamp });
  localStorage.setItem(key, JSON.stringify([record, ...listProjectReagents()]));
  return record;
}
