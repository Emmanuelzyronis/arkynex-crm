import "server-only";
import { db } from "@/lib/db";
import {
  leads,
  leadStageHistory,
  communications,
  teamMembers,
} from "@/lib/db/schema";
import type { Lead, LeadStageHistory, Communication } from "@/lib/db/schema";
import {
  eq,
  and,
  or,
  ilike,
  inArray,
  isNull,
  gte,
  lte,
  lt,
  asc,
  desc,
  getTableColumns,
} from "drizzle-orm";

export type { Lead, LeadStageHistory, Communication };

export type LeadSort = "score" | "recent" | "name" | "last_contact";

export type LeadFilters = {
  stage?: string;
  archived?: boolean;
  search?: string;
  source?: string;
  propertyType?: string;
  timeline?: string;
  minScore?: number;
  maxScore?: number;
  minBudget?: number;
  maxBudget?: number;
  /** A team member id, or "unassigned". */
  assignedToId?: string;
  lastContactedBefore?: Date;
  createdAfter?: Date;
  sort?: LeadSort;
};

export type LeadWithAssignee = Lead & { assignedToName: string | null };

/** Shared WHERE builder so smart lists and the leads page filter identically. */
export function buildLeadConditions(agentId: string, filters: LeadFilters = {}) {
  const conditions = [eq(leads.agentId, agentId)];

  if (filters.stage && filters.stage !== "all") {
    const stages = filters.stage.split(",");
    conditions.push(
      stages.length === 1 ? eq(leads.stage, stages[0]) : inArray(leads.stage, stages),
    );
  }

  if (typeof filters.archived === "boolean") {
    conditions.push(eq(leads.archived, filters.archived));
  } else {
    conditions.push(eq(leads.archived, false));
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    conditions.push(
      or(ilike(leads.fullName, q), ilike(leads.phone, q), ilike(leads.email, q))!,
    );
  }

  if (filters.source) conditions.push(eq(leads.source, filters.source));
  if (filters.propertyType) conditions.push(eq(leads.propertyType, filters.propertyType));
  if (filters.timeline) conditions.push(eq(leads.timeline, filters.timeline));
  if (typeof filters.minScore === "number") conditions.push(gte(leads.score, filters.minScore));
  if (typeof filters.maxScore === "number") conditions.push(lte(leads.score, filters.maxScore));
  if (typeof filters.minBudget === "number") conditions.push(gte(leads.budgetMax, filters.minBudget));
  if (typeof filters.maxBudget === "number") conditions.push(lte(leads.budgetMin, filters.maxBudget));

  if (filters.assignedToId === "unassigned") {
    conditions.push(isNull(leads.assignedToId));
  } else if (filters.assignedToId) {
    conditions.push(eq(leads.assignedToId, filters.assignedToId));
  }

  if (filters.lastContactedBefore) {
    conditions.push(
      or(
        lt(leads.lastContactedAt, filters.lastContactedBefore),
        and(isNull(leads.lastContactedAt), lt(leads.createdAt, filters.lastContactedBefore)),
      )!,
    );
  }

  if (filters.createdAfter) conditions.push(gte(leads.createdAt, filters.createdAfter));

  return conditions;
}

function leadOrderBy(sort: LeadSort = "score") {
  switch (sort) {
    case "recent":
      return [desc(leads.createdAt)];
    case "name":
      return [asc(leads.fullName)];
    case "last_contact":
      return [asc(leads.lastContactedAt), desc(leads.createdAt)];
    default:
      return [desc(leads.score), desc(leads.createdAt)];
  }
}

/**
 * Fetch all leads for the agent, with optional filters.
 * Scopes manually to agentId — no RLS.
 */
export async function getLeads(
  agentId: string,
  filters: LeadFilters = {},
): Promise<LeadWithAssignee[]> {
  const conditions = buildLeadConditions(agentId, filters);
  const data = await db
    .select({ ...getTableColumns(leads), assignedToName: teamMembers.fullName })
    .from(leads)
    .leftJoin(teamMembers, eq(leads.assignedToId, teamMembers.id))
    .where(and(...conditions))
    .orderBy(...leadOrderBy(filters.sort));

  return data;
}

export type LeadWithRelations = LeadWithAssignee & {
  leadStageHistory: LeadStageHistory[];
  communications: Communication[];
};

/**
 * Fetch a single lead by id, with stage history and communications.
 */
export async function getLead(
  agentId: string,
  id: string,
): Promise<LeadWithRelations | null> {
  const [lead] = await db
    .select({ ...getTableColumns(leads), assignedToName: teamMembers.fullName })
    .from(leads)
    .leftJoin(teamMembers, eq(leads.assignedToId, teamMembers.id))
    .where(and(eq(leads.id, id), eq(leads.agentId, agentId)))
    .limit(1);

  if (!lead) return null;

  const [history, comms] = await Promise.all([
    db
      .select()
      .from(leadStageHistory)
      .where(eq(leadStageHistory.leadId, id))
      .orderBy(desc(leadStageHistory.createdAt)),
    db
      .select()
      .from(communications)
      .where(eq(communications.leadId, id))
      .orderBy(desc(communications.createdAt)),
  ]);

  return {
    ...lead,
    leadStageHistory: history,
    communications: comms,
  };
}
