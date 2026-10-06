import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, teamMembers } from "@/lib/db/schema";
import { isLeadRoutingEnabled } from "@/lib/db/queries/team";

/**
 * Pick the active team member with the fewest assigned leads (round-robin by
 * load) when routing is enabled. Returns null when routing is off or the
 * account has no active members.
 */
export async function pickNextAssignee(agentId: string): Promise<string | null> {
  if (!(await isLeadRoutingEnabled(agentId))) return null;

  const members = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(eq(teamMembers.ownerId, agentId), eq(teamMembers.status, "active")))
    .orderBy(asc(teamMembers.createdAt));

  if (members.length === 0) return null;

  const counts = await db
    .select({ assignedToId: leads.assignedToId, count: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(eq(leads.agentId, agentId), eq(leads.archived, false)))
    .groupBy(leads.assignedToId);

  const countByMember = new Map(counts.map((row) => [row.assignedToId, row.count]));

  let best = members[0].id;
  let bestCount = countByMember.get(best) ?? 0;
  for (const member of members.slice(1)) {
    const count = countByMember.get(member.id) ?? 0;
    if (count < bestCount) {
      best = member.id;
      bestCount = count;
    }
  }
  return best;
}
