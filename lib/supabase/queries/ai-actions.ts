import type { Database, Tables, SupaClient } from "@/lib/supabase/types";

export type AIActionRow = Tables<"ai_actions">;

export type AIActionGroup = {
  priority: string;
  label: string;
  color: string;
  actions: AIActionRow[];
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  urgent: { label: "Urgent", color: "#EF4444", order: 0 },
  today: { label: "Today", color: "#F59E0B", order: 1 },
  this_week: { label: "This Week", color: "#3B82F6", order: 2 },
};

export async function getAIActions(
  supabase: SupaClient,
  includeCompleted = false,
): Promise<AIActionGroup[]> {
  let query = supabase
    .from("ai_actions")
    .select("*")
    .order("generated_date", { ascending: false })
    .order("priority", { ascending: true });

  if (!includeCompleted) {
    query = query.eq("completed", false).eq("dismissed", false);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;

  // Group by priority
  const byPriority: Record<string, AIActionRow[]> = {};
  for (const action of data ?? []) {
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
