import { NextResponse } from "next/server";

import { createStaleLeadTasks } from "@/lib/cron/run";

/** Vercel Cron / on-demand — create follow-up tasks for quiet leads. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await createStaleLeadTasks();
  return NextResponse.json(result);
}
