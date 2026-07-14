"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadCloud, WandSparkles } from "lucide-react";

const subjects = ["Organic synthesis", "LCMS", "Western blot", "General chemistry", "Chemical biology", "Other"];
const levels = ["Beginner", "Intermediate", "Advanced"];
const languages = ["English", "Traditional Chinese", "Bilingual"];

export function NewProjectForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/lab-prep", {
      method: "POST",
      body: formData
    });

    const payload = await response.json().catch(() => ({
      error: "The server returned an unexpected response. Please try again."
    }));
    setIsSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not generate guide.");
      return;
    }

    router.push(`/dashboard/project/${payload.projectId}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-md border border-ink/10 bg-white p-5 shadow-sm">
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Project title</span>
        <input required name="title" className="rounded-md border border-ink/15 px-3 py-2 outline-none focus:border-moss" placeholder="e.g. Suzuki coupling prep" />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <Select label="Subject area" name="subjectArea" options={subjects} />
        <Select label="User level" name="userLevel" options={levels} />
        <Select label="Preferred output language" name="preferredLanguage" options={languages} />
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Supervisor message or protocol</span>
        <textarea
          required
          name="rawInput"
          rows={12}
          className="resize-y rounded-md border border-ink/15 px-3 py-2 leading-6 outline-none focus:border-moss"
          placeholder="Paste protocol, reagent table text, safety notes, lecture material, or supervisor instructions..."
        />
      </label>

      <label className="grid cursor-pointer gap-3 rounded-md border border-dashed border-ink/25 bg-paper p-5 text-center">
        <UploadCloud className="mx-auto text-moss" size={28} />
        <span className="font-semibold">Upload PDF, image, Excel, or notes</span>
        <span className="text-sm text-ink/60">MVP stores metadata; extraction pipeline is prepared in the database schema.</span>
        <input name="file" type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.txt,.md" />
      </label>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button disabled={isSubmitting} className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-5 py-3 font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-60">
        <WandSparkles size={18} />
        {isSubmitting ? "Generating..." : "Generate Lab Prep Guide"}
      </button>
    </form>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <select name={name} className="rounded-md border border-ink/15 bg-white px-3 py-2 outline-none focus:border-moss">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
