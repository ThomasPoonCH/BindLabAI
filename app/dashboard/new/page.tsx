import { AppShell } from "@/components/AppShell";
import { NewProjectForm } from "./project-form";

export default function NewProjectPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">New Lab Prep</h1>
          <p className="mt-2 text-ink/65">Turn messy lab content into a preparation guide with gaps, risks, and supervisor questions.</p>
        </div>
        <NewProjectForm />
      </main>
    </AppShell>
  );
}
