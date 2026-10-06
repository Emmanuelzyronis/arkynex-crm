import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, profiles, teamMembers } from "@/lib/db/schema";
import type { TeamMember } from "@/lib/db/schema";

export type { TeamMember };

export type TeamMemberWithStats = TeamMember & { openLeads: number };

export async function getTeamMembers(agentId: string): Promise<TeamMemberWithStats[]> {
  const [rows, counts] = await Promise.all([
    db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.ownerId, agentId))
      .orderBy(asc(teamMembers.createdAt)),
    db
      .select({ assignedToId: leads.assignedToId, count: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(eq(leads.agentId, agentId), eq(leads.archived, false)))
      .groupBy(leads.assignedToId),
  ]);

  const countByMember = new Map(counts.map((row) => [row.assignedToId, row.count]));
  return rows.map((member) => ({
    ...member,
    openLeads: countByMember.get(member.id) ?? 0,
  }));
}

export async function getActiveTeamMembers(agentId: string): Promise<TeamMember[]> {
  return db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.ownerId, agentId), eq(teamMembers.status, "active")))
    .orderBy(asc(teamMembers.createdAt));
}

export async function isLeadRoutingEnabled(agentId: string): Promise<boolean> {
  const [row] = await db
    .select({ enabled: profiles.leadRoutingEnabled })
    .from(profiles)
    .where(eq(profiles.id, agentId))
    .limit(1);
  return row?.enabled ?? false;
}
