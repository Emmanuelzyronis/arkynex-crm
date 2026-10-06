import "server-only";

import { and, eq, isNull, lt, notExists, notInArray, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, tasks } from "@/lib/db/schema";
import { getActiveAgentIds } from "@/lib/ai/generate-actions";
import { scoreLead } from "@/lib/ai/score-lead";
import { enqueueJobs } from "@/lib/queue";

/** Fan out nightly AI action generation onto the durable queue. */
export async function fanoutAiActions(): Promise<number> {
  const agents = await getActiveAgentIds();
  return enqueueJobs(
    agents.map((agentId) => ({
      type: "ai.generate-actions",
      payload: { agentId },
      maxAttempts: 3,
    })),
  );
}

/** Recompute lead scores (all leads, or one via `leadId`). */
export async function scoreAllLeads(leadId?: string | null): Promise<{ updated: number }> {
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
  return { updated };
}

const STALE_DAYS = 3;
const MAX_STALE_TASKS = 50;
const CLOSED_STAGES = ["closed", "lost"];

/** Create a follow-up task for leads that have gone quiet. */
export async function createStaleLeadTasks(): Promise<{ created: number }> {
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
    .limit(MAX_STALE_TASKS);

  if (staleLeads.length === 0) return { created: 0 };

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

  return { created: staleLeads.length };
}
