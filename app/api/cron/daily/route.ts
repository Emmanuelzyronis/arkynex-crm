import { NextResponse } from "next/server";

import { createStaleLeadTasks, fanoutAiActions, scoreAllLeads } from "@/lib/cron/run";
import { processJobs } from "@/lib/queue/worker";

// Allow the drain loop to finish within the Hobby plan's function limit.
export const maxDuration = 60;

const MAX_BATCHES = 3;
const BATCH_SIZE = 10;

/**
 * Single consolidated Vercel Cron entry point (Hobby allows daily crons only).
 *
 * Runs the nightly maintenance tasks, then drains the durable job queue. Any
 * jobs left pending (e.g. more agents than fit in the time budget) are retried
 * on the next run thanks to the queue's backoff. On a Pro plan you can move
 * `/api/cron/process-jobs` back to an every-minute schedule for near-real-time
 * processing.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const queued = await fanoutAiActions();
  const [scored, stale] = await Promise.all([scoreAllLeads(), createStaleLeadTasks()]);

  let processed = 0;
  let failed = 0;
  let drainedBatches = 0;

  for (let i = 0; i < MAX_BATCHES; i++) {
    const result = await processJobs(BATCH_SIZE);
    processed += result.processed;
    failed += result.failed;
    drainedBatches++;
    if (result.claimed < BATCH_SIZE) break;
  }

  return NextResponse.json({
    queued,
    scored: scored.updated,
    staleTasks: stale.created,
    processed,
    failed,
    drainedBatches,
  });
}
