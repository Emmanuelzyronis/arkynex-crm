import { NextResponse } from "next/server";
import { and, eq, isNull, lt, notExists, notInArray, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, tasks } from "@/lib/db/schema";

const STALE_DAYS = 3;
const MAX_TASKS_PER_RUN = 50;
const CLOSED_STAGES = ["closed", "lost"];

/** Vercel Cron — create a follow-up task for leads that have gone quiet. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000);

  const staleLeads = await db
    .select({ id: leads.id, agentId: leads.agentId, fullName: leads.fullName })
    .from(leads)
    .where(
      and(
        eq(leads.archived, false),
        notInArray(leads.stage, CLOSED_STAGES),
        or(
          lt(leads.lastContactedAt, cutoff),
          and(isNull(leads.lastContactedAt), lt(leads.createdAt, cutoff)),
        ),
        notExists(
          db
            .select({ one: sql`1` })
            .from(tasks)
            .where(and(eq(tasks.leadId, leads.id), eq(tasks.completed, false))),
        ),
      ),
    )
    .limit(MAX_TASKS_PER_RUN);

  if (staleLeads.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  const dueAt = new Date();
  dueAt.setHours(9, 0, 0, 0);

  await db.insert(tasks).values(
    staleLeads.map((lead) => ({
      agentId: lead.agentId,
      leadId: lead.id,
      title: `Re-engage ${lead.fullName.split(" ")[0] || lead.fullName}`,
      notes: `No contact in ${STALE_DAYS}+ days — check in and share something useful.`,
      type: "follow_up",
      priority: "normal",
      dueAt,
    })),
  );

  return NextResponse.json({ created: staleLeads.length });
}
