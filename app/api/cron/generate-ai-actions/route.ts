import { NextResponse } from "next/server";

import { fanoutAiActions } from "@/lib/cron/run";

/** Vercel Cron / on-demand — fan out AI action generation onto the job queue. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const queued = await fanoutAiActions();
  return NextResponse.json({ queued });
}
