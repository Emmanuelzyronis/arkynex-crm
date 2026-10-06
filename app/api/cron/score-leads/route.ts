import { NextResponse } from "next/server";

import { scoreAllLeads } from "@/lib/cron/run";

/** Vercel Cron / on-demand — recompute lead scores. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const leadId = new URL(request.url).searchParams.get("leadId");
  const result = await scoreAllLeads(leadId);
  return NextResponse.json(result);
}
