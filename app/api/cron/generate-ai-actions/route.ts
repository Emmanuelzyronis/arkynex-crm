import { NextResponse } from "next/server";

import { getActiveAgentIds } from "@/lib/ai/generate-actions";
import { enqueueJobs } from "@/lib/queue";

/**
 * Vercel Cron — fan out nightly AI action generation onto the durable job
 * queue. `/api/cron/process-jobs` (every minute) then does the model + DB work
 * off the cron request path, with retries and backoff.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const agents = await getActiveAgentIds();
  const queued = await enqueueJobs(
    agents.map((agentId) => ({
      type: "ai.generate-actions",
      payload: { agentId },
      maxAttempts: 3,
    })),
  );

  return NextResponse.json({ agents: agents.length, queued });
}
