import { AppShell } from "@/components/AppShell";
import { AnalysisPlansClient } from "./analysis-plans-client";

export default function AnalysisPlansPage() {
  return <AppShell><main className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><AnalysisPlansClient /></main></AppShell>;
}
