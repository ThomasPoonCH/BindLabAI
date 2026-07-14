export function FormulaBox({ formula, explanation }: { formula: string; explanation: string }) {
  return (
    <div className="rounded-md bg-paper p-3 text-sm">
      <p className="font-mono text-ink">{formula}</p>
      <p className="mt-2 leading-6 text-ink/68">{explanation}</p>
    </div>
  );
}
