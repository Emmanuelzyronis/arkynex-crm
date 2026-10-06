import { NextResponse } from "next/server";

import { processJobs } from "@/lib/queue/worker";

/** Vercel Cron — drain the durable background job queue (runs every minute). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processJobs(20);
  return NextResponse.json(result);
}
