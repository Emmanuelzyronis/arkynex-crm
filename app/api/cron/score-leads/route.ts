import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { scoreLead } from "@/lib/ai/score-lead";

/** Vercel Cron — recompute lead scores (all leads, or one via ?leadId=). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const leadId = new URL(request.url).searchParams.get("leadId");

  const rows = leadId
    ? await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
    : await db.select().from(leads);

  let updated = 0;
  for (const lead of rows) {
    const score = scoreLead(lead);
    if (score !== lead.score) {
      await db.update(leads).set({ score }).where(eq(leads.id, lead.id));
    }
    updated++;
  }

  return NextResponse.json({ updated });
}
