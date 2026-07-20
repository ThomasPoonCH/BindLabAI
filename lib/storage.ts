import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { LabPrepGuide, LabPrepInput } from "@/lib/ai/types";

type StoredProject = {
  id: string;
  title: string;
  subject_area: string;
  user_level: string;
  preferred_language: string;
  raw_input: string;
  created_at: string;
  updated_at: string;
};

type StoredGeneration = {
  id: string;
  project_id: string;
  model_provider: string;
  model_name: string;
  prompt: string;
  output_json: LabPrepGuide;
  created_at: string;
};

export type StoredCalculationLog = {
  id: string;
  project_id: string | null;
  calculator_type: string;
  input_json: unknown;
  result_json: unknown;
  formula?: string | null;
  explanation?: string | null;
  created_at: string;
};

type LocalData = {
  projects: StoredProject[];
  generations: StoredGeneration[];
  calculation_logs: StoredCalculationLog[];
};

const dataDir = path.join(process.cwd(), ".local-data");
const dataFile = path.join(dataDir, "bind-lab-ai.json");

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function listLocalProjects() {
  const data = await readLocalData();
  return data.projects.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getLocalProject(id: string) {
  const data = await readLocalData();
  return data.projects.find((project) => project.id === id) ?? null;
}

export async function getLatestLocalGeneration(projectId: string) {
  const data = await readLocalData();
  return data.generations
    .filter((generation) => generation.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
}

export async function saveLocalProject(input: LabPrepInput, projectId: string) {
  const data = await readLocalData();
  const now = new Date().toISOString();
  const project: StoredProject = {
    id: projectId,
    title: input.title,
    subject_area: input.subjectArea,
    user_level: input.userLevel,
    preferred_language: input.preferredLanguage,
    raw_input: input.rawInput,
    created_at: now,
    updated_at: now
  };
  data.projects.push(project);
  await writeLocalData(data);
  return project;
}

export async function saveLocalGeneration(generation: StoredGeneration) {
  const data = await readLocalData();
  data.generations.push(generation);
  await writeLocalData(data);
}

export async function listLocalCalculationLogs(projectId: string) {
  const data = await readLocalData();
  return data.calculation_logs
    .filter((log) => log.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function saveLocalCalculationLog(log: StoredCalculationLog) {
  const data = await readLocalData();
  data.calculation_logs.push(log);
  await writeLocalData(data);
}

async function readLocalData(): Promise<LocalData> {
  try {
    const raw = await readFile(dataFile, "utf8");
    if (!raw.trim()) return { projects: [], generations: [], calculation_logs: [] };
    const parsed = JSON.parse(raw) as Partial<LocalData>;
    return {
      projects: parsed.projects ?? [],
      generations: parsed.generations ?? [],
      calculation_logs: parsed.calculation_logs ?? []
    };
  } catch {
    return { projects: [], generations: [], calculation_logs: [] };
  }
}

async function writeLocalData(data: LocalData) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2));
}
