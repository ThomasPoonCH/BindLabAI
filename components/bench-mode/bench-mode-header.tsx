import Link from "next/link";
import { ArrowLeft, Pause, Play, Square } from "lucide-react";
import type { BenchSession } from "@/lib/bench-mode/types";

export function BenchModeHeader({ session, progress, dispatch }: { session: BenchSession; progress: number; dispatch: React.Dispatch<import("@/lib/bench-mode/types").BenchAction> }) {
  return (
    <header className="border-b border-ink/10 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/reaction/new" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink"><ArrowLeft size={16} /> Back to experiment</Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold sm:text-3xl">Live Bench Mode</h1>
              <span className="rounded-full border border-copper/25 bg-copper/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-copper">Demo status</span>
            </div>
            <p className="mt-2 text-sm text-ink/60">Started at {new Date(session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => dispatch({ type: "TOGGLE_PAUSE" })} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-ink/15 bg-white px-4 font-semibold hover:bg-paper">
              {session.paused ? <Play size={17} /> : <Pause size={17} />} {session.paused ? "Resume session" : "Pause session"}
            </button>
            <button type="button" onClick={() => dispatch({ type: "END_DEMO" })} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-copper/25 px-4 font-semibold text-copper hover:bg-copper/5"><Square size={16} /> End demo</button>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-moss transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          <span className="text-sm font-semibold tabular-nums">{Math.round(progress)}%</span>
        </div>
        <p className="mt-4 rounded-md border border-copper/15 bg-copper/5 px-4 py-3 text-sm font-semibold text-ink/72">Demo only — all actions require researcher confirmation.</p>
      </div>
    </header>
  );
}
