import { Activity, Calculator, FlaskConical, Microscope, NotebookPen, Sparkles } from "lucide-react";
import type { TimelineEvent } from "@/lib/bench-mode/types";

const icons = { session: Activity, action: FlaskConical, calculation: Calculator, deviation: Activity, observation: NotebookPen, analysis: Microscope, decision: Sparkles };

export function ExperimentTimeline({ events, onReplay }: { events: TimelineEvent[]; onReplay: () => void }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Experiment timeline</h2><button type="button" onClick={onReplay} className="text-sm font-semibold text-moss hover:underline">Replay experiment</button></div>
      <div className="mt-5 max-h-[520px] space-y-0 overflow-y-auto pr-1">{[...events].reverse().map((event, index) => { const Icon = icons[event.category]; return <div key={event.id} className="relative flex gap-3 pb-5"><div className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/10 bg-paper"><Icon size={14} /></div>{index < events.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-ink/10" />}<div className="min-w-0 pt-1"><p className="break-words text-sm font-semibold">{event.label}</p><p className="mt-1 text-xs text-ink/42">{new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · {event.category}</p></div></div>; })}</div>
    </section>
  );
}
