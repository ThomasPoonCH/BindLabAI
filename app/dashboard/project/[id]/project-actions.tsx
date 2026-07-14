"use client";

import { Copy, Download, RefreshCw } from "lucide-react";
import type { LabPrepGuide } from "@/lib/ai/types";
import { guideToMarkdown } from "@/lib/markdown";

export function ProjectActions({ projectId, guide, title }: { projectId: string; guide: LabPrepGuide; title: string }) {
  const markdown = guideToMarkdown(title, guide);

  async function copyAll() {
    await navigator.clipboard.writeText(markdown);
  }

  function exportMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "lab-prep-guide"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function regenerate() {
    const response = await fetch(`/api/lab-prep/${projectId}/regenerate`, { method: "POST" });
    if (response.ok) window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={regenerate} className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold">
        <RefreshCw size={16} />
        Regenerate
      </button>
      <button onClick={copyAll} className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm font-semibold">
        <Copy size={16} />
        Copy all
      </button>
      <button onClick={exportMarkdown} className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-semibold text-paper">
        <Download size={16} />
        Export as Markdown
      </button>
    </div>
  );
}
