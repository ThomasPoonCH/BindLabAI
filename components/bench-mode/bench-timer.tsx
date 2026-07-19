"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { demoPlan } from "@/lib/bench-mode/demo-data";
import type { BenchAction, BenchSession } from "@/lib/bench-mode/types";

function display(seconds: number) {
  const remaining = Math.max(0, demoPlan.durationSeconds - seconds);
  return [Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60].map(value => String(value).padStart(2, "0")).join(":");
}

export function BenchTimer({ session, dispatch }: { session: BenchSession; dispatch: React.Dispatch<BenchAction> }) {
  return (
    <div className="rounded-md border border-ink/10 bg-ink p-5 text-paper">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-paper/55">Reaction countdown</p>
      <div className="mt-3 font-mono text-4xl font-semibold tabular-nums tracking-normal">{display(session.elapsedSeconds)}</div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => dispatch({ type: session.timerRunning ? "TIMER_PAUSE" : "TIMER_START" })} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-paper px-3 text-sm font-semibold text-ink">{session.timerRunning ? <Pause size={15} /> : <Play size={15} />}{session.timerRunning ? "Pause" : "Start"}</button>
        <button type="button" onClick={() => dispatch({ type: "TIMER_RESET" })} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-paper/20 px-3 text-sm font-semibold"><RotateCcw size={15} /> Reset</button>
        <button type="button" onClick={() => dispatch({ type: "JUMP_TO_CHECKPOINT" })} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-copper/60 px-3 text-sm font-semibold text-[#efb28f]"><SkipForward size={15} /> Jump to LCMS</button>
      </div>
    </div>
  );
}
