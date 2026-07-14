"use client";

export function InputWithUnit({
  label,
  value,
  onChange,
  unit,
  step = "any",
  min
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  step?: string;
  min?: number;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">{label}</span>
      <div className="flex overflow-hidden rounded-md border border-ink/15 bg-white">
        <input
          type="number"
          step={step}
          min={min}
          value={Number.isNaN(value) ? "" : value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="min-w-0 flex-1 px-3 py-2 outline-none"
        />
        <span className="grid min-w-16 place-items-center border-l border-ink/10 bg-paper px-3 text-sm text-ink/65">{unit}</span>
      </div>
    </label>
  );
}
