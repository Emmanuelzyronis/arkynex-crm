import "server-only";

import { and, desc, eq, gte, inArray, lt, lte, notInArray, or, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  aiActions,
  deals,
  leads,
  profiles,
  properties,
  viewings,
} from "@/lib/db/schema";
import { channelName, publishEvent } from "@/lib/realtime/ably";
import { chatJSON, isLlmConfigured } from "@/lib/ai/llm";

const STALE_LEAD_DAYS = 5;
const DEAL_PROBABILITY_DROP_THRESHOLD = 0.3;

type PendingAction = typeof aiActions.$inferInsert;

/** Agents eligible for AI action generation. */
export async function getActiveAgentIds(): Promise<string[]> {
  const rows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(inArray(profiles.subscriptionStatus, ["active", "trialing"]));
  return rows.map((r) => r.id);
}

/** Builds today's prioritised actions for one agent (pure DB reads). */
export async function generateActionsForAgent(agentId: string): Promise<PendingAction[]> {
  const today = new Date().toISOString().split("T")[0];
  const actions: PendingAction[] = [];

  // 1. Stale leads
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_LEAD_DAYS);

  const staleLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.agentId, agentId),
        eq(leads.archived, false),
        notInArray(leads.stage, ["closed", "lost"]),
        or(isNull(leads.lastContactedAt), lt(leads.lastContactedAt, staleThreshold)),
      ),
    )
    .orderBy(desc(leads.score))
    .limit(3);

  for (const lead of staleLeads) {
    const daysSince = lead.lastContactedAt
      ? Math.floor((Date.now() - new Date(lead.lastContactedAt).getTime()) / 86400000)
      : null;

    actions.push({
      agentId,
      leadId: lead.id,
      priority: lead.score >= 70 ? "urgent" : "today",
      actionType: "follow_up",
      title: `Follow up with ${lead.fullName}`,
      body: daysSince
        ? `${lead.fullName} hasn't been contacted in ${daysSince} days. Score: ${lead.score}. Stage: ${lead.stage}.`
        : `${lead.fullName} has never been contacted. Score: ${lead.score}. Stage: ${lead.stage}.`,
      suggestedMessage: `Hi ${lead.fullName.split(" ")[0]}, just checking in — are you still looking for a property? I have some great new listings that might interest you.`,
      generatedDate: today,
    });
  }

  // 2. Upcoming viewings (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

  const upcoming = await db
    .select({
      id: viewings.id,
      scheduledAt: viewings.scheduledAt,
      leadId: viewings.leadId,
      leadName: leads.fullName,
      propertyTitle: properties.title,
    })
    .from(viewings)
    .innerJoin(leads, eq(viewings.leadId, leads.id))
    .innerJoin(properties, eq(viewings.propertyId, properties.id))
    .where(
      and(
        eq(viewings.agentId, agentId),
        eq(viewings.status, "scheduled"),
        gte(viewings.scheduledAt, tomorrowStart),
        lte(viewings.scheduledAt, tomorrowEnd),
      ),
    );

  for (const viewing of upcoming) {
    const time = new Date(viewing.scheduledAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    actions.push({
      agentId,
      leadId: viewing.leadId,
      priority: "today",
      actionType: "confirm_viewing",
      title: `Confirm tomorrow's viewing with ${viewing.leadName}`,
      body: `Viewing of ${viewing.propertyTitle} is scheduled for tomorrow at ${time}.`,
      suggestedMessage: `Hi ${viewing.leadName.split(" ")[0]}, just confirming your viewing tomorrow at ${time} — looking forward to showing you the property!`,
      generatedDate: today,
    });
  }

  // 3. Past viewings without a logged outcome
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const past = await db
    .select({
      id: viewings.id,
      leadId: viewings.leadId,
      leadName: leads.fullName,
      propertyTitle: properties.title,
    })
    .from(viewings)
    .innerJoin(leads, eq(viewings.leadId, leads.id))
    .innerJoin(properties, eq(viewings.propertyId, properties.id))
    .where(
      and(
        eq(viewings.agentId, agentId),
        eq(viewings.status, "scheduled"),
        gte(viewings.scheduledAt, twoDaysAgo),
        lt(viewings.scheduledAt, new Date()),
      ),
    )
    .limit(2);

  for (const viewing of past) {
    actions.push({
      agentId,
      leadId: viewing.leadId,
      priority: "today",
      actionType: "log_outcome",
      title: `Log outcome for ${viewing.leadName}'s viewing`,
      body: `The viewing of ${viewing.propertyTitle} has passed but no outcome was logged. Add a rating and notes.`,
      generatedDate: today,
    });
  }

  // 4. Stalled deals
  const stalled = await db
    .select({
      id: deals.id,
      closingProbability: deals.closingProbability,
      leadName: leads.fullName,
      propertyTitle: properties.title,
    })
    .from(deals)
    .leftJoin(leads, eq(deals.leadId, leads.id))
    .leftJoin(properties, eq(deals.propertyId, properties.id))
    .where(
      and(
        eq(deals.agentId, agentId),
        notInArray(deals.status, ["completed", "fallen_through"]),
        lte(deals.closingProbability, DEAL_PROBABILITY_DROP_THRESHOLD),
      ),
    )
    .limit(2);

  for (const deal of stalled) {
    const prob = Math.round((deal.closingProbability ?? 0) * 100);
    actions.push({
      agentId,
      dealId: deal.id,
      priority: "urgent",
      actionType: "check_deal",
      title: `Review stalled deal: ${deal.propertyTitle ?? "Deal"}`,
      body: `The deal with ${deal.leadName ?? "Lead"} for ${deal.propertyTitle ?? "the property"} has a closing probability of only ${prob}%. It may need attention.`,
      generatedDate: today,
    });
  }

  // 5. New leads captured today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const fresh = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.agentId, agentId),
        eq(leads.stage, "new"),
        gte(leads.createdAt, todayStart),
      ),
    )
    .limit(3);

  for (const lead of fresh) {
    actions.push({
      agentId,
      leadId: lead.id,
      priority: lead.score >= 80 ? "urgent" : "today",
      actionType: "follow_up",
      title: `New lead: reach out to ${lead.fullName}`,
      body: `${lead.fullName} was captured today via ${lead.source.replace("_", " ")} with a score of ${lead.score}. Make first contact.`,
      suggestedMessage: `Hi ${lead.fullName.split(" ")[0]}, I got your details and wanted to reach out personally. What kind of property are you looking for?`,
      generatedDate: today,
    });
  }

  return personalizeActions(actions);
}


/**
 * Rewrites the copy (title/body/suggested message) of the heuristic actions
 * with a real LLM, so the "AI" is genuinely generative. The *decision* of which
 * actions to surface stays deterministic and auditable; the LLM only phrases and
 * personalises them. Falls back to the heuristic copy when no model is configured
 * or the call fails.
 */
async function personalizeActions(
  actions: PendingAction[],
): Promise<PendingAction[]> {
  if (actions.length === 0 || !isLlmConfigured()) return actions;

  const payload = actions.map((action, index) => ({
    index,
    actionType: action.actionType,
    priority: action.priority,
    title: action.title,
    body: action.body,
    suggestedMessage: action.suggestedMessage ?? null,
  }));

  const result = await chatJSON<{
    actions?: { index: number; title?: string; body?: string; suggestedMessage?: string }[];
  }>({
    messages: [
      {
        role: "system",
        content:
          "You are the assistant inside a real estate CRM. You rewrite task cards for " +
          "a busy agent. Keep each title under 60 characters and each body under 220 " +
          "characters. Write suggested messages in a warm, concise, professional tone. " +
          "Never invent facts (prices, dates, names) that are not present in the input. " +
          "Return JSON: {\"actions\": [{\"index\": number, \"title\": string, " +
          "\"body\": string, \"suggestedMessage\": string}]} covering every input index.",
      },
      {
        role: "user",
        content: JSON.stringify(payload),
      },
    ],
    temperature: 0.5,
    maxTokens: 1200,
  });

  if (!result?.actions?.length) return actions;

  const byIndex = new Map(result.actions.map((item) => [item.index, item]));
  return actions.map((action, index) => {
    const rewritten = byIndex.get(index);
    if (!rewritten) return action;
    return {
      ...action,
      title: rewritten.title?.trim() || action.title,
      body: rewritten.body?.trim() || action.body,
      suggestedMessage: rewritten.suggestedMessage?.trim() || action.suggestedMessage,
    };
  });
}

/**
 * Regenerates today's actions for an agent, replacing any
 * undismissed/uncompleted ones (idempotent per day).
 */
export async function regenerateActionsForAgent(agentId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const actions = await generateActionsForAgent(agentId);

  await db
    .delete(aiActions)
    .where(
      and(
        eq(aiActions.agentId, agentId),
        eq(aiActions.completed, false),
        eq(aiActions.dismissed, false),
        eq(aiActions.generatedDate, sql`${today}::date`),
      ),
    );

  if (actions.length > 0) {
    await db.insert(aiActions).values(actions);
    await publishEvent(channelName("ai-actions", agentId), "refresh", {
      created: actions.length,
    });
  }

  return actions.length;
}
