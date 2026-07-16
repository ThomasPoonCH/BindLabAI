import { resolveVerifiedReagent, verifiedReagentLibrary } from "../chemistry/verified-reagents";

export type ReagentMatch = { extractedName: string; canonicalName: string | null; reagentId: string | null; matchType: "exact" | "synonym" | "normalized" | "unresolved"; confidence: number; requiresConfirmation: boolean };

export const reagentLibrary = verifiedReagentLibrary.map((record) => ({ id: record.id, name: record.canonicalName, synonyms: [...record.synonyms, ...record.abbreviations] }));

export function matchReagent(extractedName: string): ReagentMatch {
  const resolved = resolveVerifiedReagent(extractedName);
  if (resolved.record) return { extractedName, canonicalName: resolved.record.canonicalName, reagentId: resolved.record.id, matchType: resolved.matchType === "canonical" ? "exact" : "synonym", confidence: resolved.confidence, requiresConfirmation: false };
  return { extractedName, canonicalName: null, reagentId: null, matchType: "unresolved", confidence: 0, requiresConfirmation: true };
}

export function findReagentsInText(text: string) {
  const lower = text.toLowerCase();
  const candidates = reagentLibrary.flatMap(item => [item.name, ...item.synonyms].map(alias => ({ alias, start: lower.indexOf(alias.toLowerCase()) }))).filter(match => match.start >= 0).sort((a, b) => a.start - b.start || b.alias.length - a.alias.length);
  const accepted: { start: number; end: number; value: string }[] = [];
  for (const candidate of candidates) {
    const end = candidate.start + candidate.alias.length;
    if (accepted.some(match => candidate.start >= match.start && end <= match.end)) continue;
    accepted.push({ start: candidate.start, end, value: text.slice(candidate.start, end) });
  }
  const documentLabels = text.match(/\b\d{1,3}-(?:COOH|NHMe|NH2|OH|CHO|CO2H)\b/gi) ?? [];
  return [...new Set([...accepted.map(match => match.value), ...documentLabels])];
}
