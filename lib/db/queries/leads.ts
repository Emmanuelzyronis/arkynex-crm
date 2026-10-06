import "server-only";
import { db } from "@/lib/db";
import {
  leads,
  leadStageHistory,
  communications,
} from "@/lib/db/schema";
import type { Lead, LeadStageHistory, Communication } from "@/lib/db/schema";
import { eq, and, or, ilike, inArray, desc } from "drizzle-orm";

export type { Lead, LeadStageHistory, Communication };

export type LeadFilters = {
  stage?: string;
  archived?: boolean;
  search?: string;
};

/**
 * Fetch all leads for the agent, with optional filters.
 * Scopes manually to agentId — no RLS.
 */
export async function getLeads(
  agentId: string,
  filters: LeadFilters = {},
): Promise<Lead[]> {
  const conditions = [eq(leads.agentId, agentId)];

  // Stage filter (supports comma-separated multi-stage)
  if (filters.stage && filters.stage !== "all") {
    const stages = filters.stage.split(",");
    if (stages.length === 1) {
      conditions.push(eq(leads.stage, stages[0]));
    } else {
      conditions.push(inArray(leads.stage, stages));
    }
  }

  // Archived filter (defaults to false)
  if (typeof filters.archived === "boolean") {
    conditions.push(eq(leads.archived, filters.archived));
  } else {
    conditions.push(eq(leads.archived, false));
  }

  // Search on full_name and phone
  if (filters.search) {
    const q = `%${filters.search}%`;
    conditions.push(or(ilike(leads.fullName, q), ilike(leads.phone, q))!);
  }

  const data = await db
    .select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.score), desc(leads.createdAt));

  return data;
}

export type LeadWithRelations = Lead & {
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
    .select()
    .from(leads)
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
