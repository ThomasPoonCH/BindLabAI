import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ResultCard } from "@/components/ResultCard";
import { ProjectActions } from "./project-actions";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { getLatestLocalGeneration, getLocalProject, isSupabaseConfigured, listLocalCalculationLogs } from "@/lib/storage";
import { CalculatorHistory, type CalculationHistoryItem } from "@/components/calculators/CalculatorHistory";
import { calculatorDefinitions, recommendCalculatorsFromText } from "@/lib/calculators/registry";
import type { LabPrepGuide } from "@/lib/ai/types";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = isSupabaseConfigured() ? createServiceSupabaseClient() : null;
  const project = supabase
    ? (await supabase
      .from("projects")
      .select("id,title,subject_area,user_level,preferred_language,created_at")
      .eq("id", id)
      .single()).data
    : await getLocalProject(id);

  if (!project) notFound();

  const generation = supabase
    ? (await supabase
      .from("generations")
      .select("output_json,model_provider,model_name,created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()).data
    : await getLatestLocalGeneration(id);

  const guide = generation?.output_json as LabPrepGuide | undefined;
  if (!guide) notFound();

  const usefulCalculators: {
    id: string;
    title: string;
    description: string;
    reason: string;
    pre_filled_inputs?: Record<string, unknown>;
  }[] = [
    ...(guide.recommended_calculators ?? []).map((recommendation) => {
      const definition = calculatorDefinitions.find((calculator) => calculator.id === recommendation.calculator_id);
      return definition ? { ...definition, reason: recommendation.reason, pre_filled_inputs: recommendation.pre_filled_inputs as Record<string, unknown> } : null;
    }).filter((calculator): calculator is NonNullable<typeof calculator> => Boolean(calculator)),
    ...recommendCalculatorsFromText(`${project.subject_area} ${guide.experiment_goal} ${guide.beginner_explanation}`).map((calculator) => ({
      ...calculator,
      reason: calculator.description
    }))
  ].filter((calculator, index, all) => all.findIndex((item) => item.id === calculator.id) === index).slice(0, 6);

  const calculationLogs: CalculationHistoryItem[] = supabase
    ? ((await supabase
      .from("calculation_logs")
      .select("id,calculator_type,input_json,result_json,formula,explanation,created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })).data ?? [])
    : await listLocalCalculationLogs(id);

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{project.title}</h1>
            <p className="mt-2 text-sm text-ink/65">
              {project.subject_area} • {project.user_level} • {project.preferred_language}
            </p>
          </div>
          <ProjectActions projectId={id} guide={guide} title={project.title} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-md border border-ink/10 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Useful Calculators for This Project</h2>
                <p className="mt-2 text-sm leading-6 text-ink/65">Recommended from the project topic and AI output. Use deterministic calculators for exact numbers.</p>
              </div>
              <a href={`/dashboard/calculators?projectId=${id}`} className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper">Open Calculator Suite</a>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {usefulCalculators.map((calculator) => (
                <div key={calculator.id} className="rounded-md border border-ink/10 bg-paper p-4">
                  <h3 className="font-semibold">{calculator.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">{calculator.reason}</p>
                  {Object.keys(calculator.pre_filled_inputs ?? {}).length > 0 && (
                    <pre className="mt-3 overflow-auto rounded-md bg-white p-2 text-xs">{JSON.stringify(calculator.pre_filled_inputs, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          </section>

          <ResultCard title="What you are doing">{guide.experiment_goal}</ResultCard>
          <ResultCard title="Explain like I know nothing">
            <p>{guide.beginner_explanation}</p>
            <div className="mt-4 grid gap-2">
              {guide.key_terms.map((term) => (
                <p key={term.term}><strong>{term.term}:</strong> {term.simple_explanation}</p>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="Step-by-step protocol">
            <ol className="grid gap-3">
              {guide.step_by_step_protocol.map((step) => (
                <li key={step.step_number}>
                  <strong>{step.step_number}. {step.action}</strong>
                  <p>{step.beginner_note}</p>
                  <p className="text-copper">Risk or common mistake: {step.risk_or_common_mistake}</p>
                </li>
              ))}
            </ol>
          </ResultCard>
          <ResultCard title="Reagent and calculation checklist">
            <div className="grid gap-3">
              {guide.reagent_calculation_checklist.map((item) => (
                <div key={item.item} className="rounded-md bg-paper p-3">
                  <strong>{item.item}</strong>
                  <p>{item.formula_or_reasoning}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-moss">{item.status}</p>
                </div>
              ))}
            </div>
          </ResultCard>
          <ResultCard title="Missing info to confirm">
            <ul className="grid gap-3">
              {guide.missing_information.map((item) => (
                <li key={item.missing_item}>
                  <strong>{item.missing_item}</strong>
                  <p>{item.why_it_matters}</p>
                  <p>Ask: {item.suggested_question}</p>
                </li>
              ))}
            </ul>
          </ResultCard>
          <ResultCard title="Safety warnings">
            <ul className="grid gap-3">
              {guide.safety_warnings.map((item) => (
                <li key={item.warning}>
                  <strong>{item.warning}</strong>
                  <p>{item.why_it_matters}</p>
                  <p>{item.what_to_do}</p>
                </li>
              ))}
            </ul>
          </ResultCard>
          <ResultCard title="Questions to ask supervisor">
            <ul className="list-disc pl-5">
              {guide.questions_to_ask_supervisor.map((question) => <li key={question}>{question}</li>)}
            </ul>
          </ResultCard>
          <ResultCard title="Lab notebook draft">
            <p className="whitespace-pre-wrap">{guide.lab_notebook_draft}</p>
          </ResultCard>
          <ResultCard title="Assumptions made by AI">
            <ul className="list-disc pl-5">
              {guide.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
            </ul>
            <p className="mt-3"><strong>Confidence notes:</strong> {guide.confidence_notes}</p>
          </ResultCard>

          <section className="lg:col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Calculations used in this project</h2>
            <CalculatorHistory items={calculationLogs} />
          </section>
        </div>
      </main>
    </AppShell>
  );
}
