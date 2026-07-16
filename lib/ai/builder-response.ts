import { experimentSchema, type ExperimentRecord } from "./experiment-schema";

export type BuilderError = {
  code?: string;
  message?: string;
  requestId?: string;
  issues?: { path: string; message: string }[];
};

export type BuilderResult =
  | { kind: "draft"; draft: ExperimentRecord; warning: BuilderError | null }
  | { kind: "error"; error: BuilderError };

export function resolveBuilderResponse(payload: unknown): BuilderResult {
  if (!payload || typeof payload !== "object") return { kind: "error", error: { code: "UNKNOWN_ERROR" } };
  const data = payload as Record<string, unknown>;
  const candidate = data.partialDraft ?? data.draft;
  if (candidate) {
    const parsed = experimentSchema.safeParse(candidate);
    if (!parsed.success) return { kind: "error", error: { code: "SCHEMA_VALIDATION_ERROR" } };
    return {
      kind: "draft",
      draft: parsed.data,
      warning: data.partialDraft
        ? ((data.error && typeof data.error === "object" ? data.error : data) as BuilderError)
        : null,
    };
  }
  return {
    kind: "error",
    error: ((data.error && typeof data.error === "object" ? data.error : data) as BuilderError),
  };
}

const hasText = (value: string | null) => Boolean(value?.trim());

export function mergeVisualRetryDraft(current: ExperimentRecord, incoming: ExperimentRecord): ExperimentRecord {
  const currentNames = new Set(current.reagents.map((item) => item.name?.trim().toLowerCase()).filter(Boolean));
  const newReagents = incoming.reagents.filter((item) => !currentNames.has(item.name?.trim().toLowerCase() ?? ""));
  return experimentSchema.parse({
    ...incoming,
    ...current,
    title: hasText(current.title) ? current.title : incoming.title,
    objective: hasText(current.objective) ? current.objective : incoming.objective,
    reactionType: hasText(current.reactionType) ? current.reactionType : incoming.reactionType,
    reagents: [...current.reagents, ...newReagents],
    conditions: {
      ...incoming.conditions,
      ...current.conditions,
      solvent: hasText(current.conditions.solvent) ? current.conditions.solvent : incoming.conditions.solvent,
      temperature: hasText(current.conditions.temperature) ? current.conditions.temperature : incoming.conditions.temperature,
      duration: hasText(current.conditions.duration) ? current.conditions.duration : incoming.conditions.duration,
      atmosphere: hasText(current.conditions.atmosphere) ? current.conditions.atmosphere : incoming.conditions.atmosphere,
      orderOfAddition: current.conditions.orderOfAddition.length ? current.conditions.orderOfAddition : incoming.conditions.orderOfAddition,
    },
    warnings: [...new Set([...current.warnings, ...incoming.warnings])],
    missingInformation: [...new Set([...current.missingInformation, ...incoming.missingInformation])],
    assumptions: [...new Set([...current.assumptions, ...incoming.assumptions])],
    updatedAt: new Date().toISOString(),
  });
}
