"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ExperimentRecord } from "@/lib/ai/experiment-schema";
import { getExperiment } from "@/lib/experiment-repository";
import { NewExperimentWorkspace } from "../../reaction/new/new-experiment-workspace";
export default function ExperimentDetail() { const { id } = useParams<{ id: string }>(); const [record, setRecord] = useState<ExperimentRecord | null | undefined>(undefined); useEffect(() => setRecord(getExperiment(id)), [id]); if (record === undefined) return <main className="p-10">Loading experiment...</main>; if (!record) return <main className="p-10"><Link href="/dashboard/experiments">Back to experiments</Link><p className="mt-5">Experiment not found or incompatible local record.</p></main>; return <main className="mx-auto max-w-6xl p-6 md:p-10"><Link href="/dashboard/experiments" className="text-sm font-semibold">Back to experiments</Link><div className="mt-5"><NewExperimentWorkspace key={record.experimentId} initial={record} /></div></main>; }
