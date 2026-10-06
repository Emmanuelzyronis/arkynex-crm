import "server-only";
import { db } from "@/lib/db";
import { aiActions } from "@/lib/db/schema";
import type { AiAction } from "@/lib/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export type { AiAction };

/** Count of outstanding (not completed, not dismissed) AI actions. */
export async function countPendingAIActions(agentId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiActions)
    .where(
      and(
        eq(aiActions.agentId, agentId),
        eq(aiActions.completed, false),
        eq(aiActions.dismissed, false),
      ),
    );
  return row?.count ?? 0;
}

export type AIActionGroup = {
  priority: string;
  label: string;
  color: string;
  actions: AiAction[];
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; order: number }
> = {
  urgent: { label: "Urgent", color: "#EF4444", order: 0 },
  today: { label: "Today", color: "#F59E0B", order: 1 },
  this_week: { label: "This Week", color: "#3B82F6", order: 2 },
};

/**
 * Fetch AI actions for the agent, grouped by priority.
 * By default, excludes completed and dismissed actions.
 */
export async function getAIActions(
  agentId: string,
  includeCompleted = false,
): Promise<AIActionGroup[]> {
  const conditions = [eq(aiActions.agentId, agentId)];

  if (!includeCompleted) {
    conditions.push(eq(aiActions.completed, false));
    conditions.push(eq(aiActions.dismissed, false));
  }

  const data = await db
    .select()
    .from(aiActions)
    .where(and(...conditions))
    .orderBy(desc(aiActions.generatedDate), asc(aiActions.priority))
    .limit(50);

  // Group by priority
  const byPriority: Record<string, AiAction[]> = {};
  for (const action of data) {
    if (!byPriority[action.priority]) byPriority[action.priority] = [];
    byPriority[action.priority].push(action);
  }

  return Object.entries(PRIORITY_CONFIG)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([priority, cfg]) => ({
      priority,
      label: cfg.label,
      color: cfg.color,
      actions: byPriority[priority] ?? [],
    }))
    .filter((g) => g.actions.length > 0);
}
