"use client";

import { Copy, NotebookPen } from "lucide-react";

export type CalculationHistoryItem = {
  id: string;
  calculator_type: string;
  input_json: unknown;
  result_json: unknown;
  formula?: string | null;
  explanation?: string | null;
  created_at: string;
};

export function CalculatorHistory({ items }: { items: CalculationHistoryItem[] }) {
  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-ink/15 bg-white p-5 text-sm text-ink/60">No calculations saved to this project yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const text = `${item.calculator_type}\nFormula: ${item.formula ?? "N/A"}\nInputs: ${JSON.stringify(item.input_json)}\nResult: ${JSON.stringify(item.result_json)}`;
        return (
          <article key={item.id} className="rounded-md border border-ink/10 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{item.calculator_type}</h3>
                <p className="mt-1 text-xs text-ink/50">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => navigator.clipboard.writeText(text)} className="rounded-md border border-ink/10 p-2" aria-label="Copy calculation">
                  <Copy size={16} />
                </button>
                <button type="button" onClick={() => navigator.clipboard.writeText(`Notebook calculation insert:\n${text}`)} className="rounded-md border border-ink/10 p-2" aria-label="Insert into lab notebook">
                  <NotebookPen size={16} />
                </button>
              </div>
            </div>
            {item.formula && <p className="mt-3 font-mono text-sm">{item.formula}</p>}
            {item.explanation && <p className="mt-2 text-sm leading-6 text-ink/68">{item.explanation}</p>}
            <pre className="mt-3 overflow-auto rounded-md bg-paper p-3 text-xs">{JSON.stringify({ inputs: item.input_json, result: item.result_json }, null, 2)}</pre>
          </article>
        );
      })}
    </div>
  );
}
