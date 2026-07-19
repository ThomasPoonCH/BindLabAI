"use client";

import { useState } from "react";
import { Camera, Plus } from "lucide-react";
import type { BenchAction, Observation } from "@/lib/bench-mode/types";

const options = ["Clear solution", "Cloudy", "Precipitate formed", "Colour changed", "No visible change", "Other"];

export function ObservationsPanel({ observations, dispatch }: { observations: Observation[]; dispatch: React.Dispatch<BenchAction> }) {
  const [kind, setKind] = useState("Cloudy");
  const [note, setNote] = useState("");
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Observations</h2>
      <div className="mt-4 flex flex-wrap gap-2">{options.map(option => <button key={option} type="button" onClick={() => setKind(option)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${kind === option ? "border-moss bg-mint/55 text-moss" : "border-ink/12"}`}>{option}</button>)}</div>
      <textarea value={note} onChange={event => setNote(event.target.value)} rows={3} placeholder="Add a short bench note..." className="mt-4 w-full resize-none rounded-md border border-ink/15 bg-paper/50 p-3 text-sm outline-none focus:border-moss" />
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => { dispatch({ type: "ADD_OBSERVATION", kind, note }); setNote(""); }} className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper"><Plus size={15} /> Record observation</button><button type="button" className="inline-flex items-center gap-2 rounded-md border border-dashed border-ink/20 px-4 py-2 text-sm text-ink/55"><Camera size={15} /> Add photo (demo)</button></div>
      {observations.length > 0 && <div className="mt-4 space-y-2">{observations.slice(-3).reverse().map(item => <div key={item.id} className="rounded-md bg-paper p-3 text-sm"><strong>{item.kind}</strong><span className="ml-2 text-xs text-ink/45">{new Date(item.createdAt).toLocaleTimeString()}</span>{item.note && <p className="mt-1 text-ink/60">{item.note}</p>}</div>)}</div>}
    </section>
  );
}
