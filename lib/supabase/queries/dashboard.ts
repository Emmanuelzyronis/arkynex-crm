import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * All dashboard data fetched in parallel.
 * Returns typed objects — components receive these as props (no Supabase in JSX).
 */

export type DashboardStats = {
  totalLeads: number;
  viewingsThisMonth: number;
  dealsInProgress: number;
  revenueThisMonth: number;
  leadsDelta: number;
  viewingsDelta: number;
  dealsDelta: number;
  revenueDelta: number;
};

export type FunnelStage = {
  label: string;
  stage: string;
  count: number;
  color: string;
};

export type RevenuePoint = {
  month: string;
  revenue: number;
};

export type LeadSourcePoint = {
  name: string;
  value: number;
  color: string;
};

export type UpcomingViewing = {
  id: string;
  propertyTitle: string;
  propertyArea: string | null;
  leadName: string;
  scheduledAt: string;
};

export type PendingAIAction = {
  id: string;
  title: string;
  priority: string;
  actionType: string;
  meta: string;
};

const FUNNEL_STAGES: Omit<FunnelStage, "count">[] = [
  { label: "New", stage: "new", color: "#D8DAFC" },
  { label: "Contacted", stage: "contacted", color: "#AEB4F8" },
  { label: "Viewing Scheduled", stage: "viewing_scheduled", color: "#8B5CF6" },
  { label: "Negotiating", stage: "negotiating", color: "#F59E0B" },
  { label: "Closed", stage: "closed", color: "#10B981" },
];

const SOURCE_COLORS: Record<string, string> = {
  whatsapp: "#5B5FEF",
  referral: "#7C3AED",
  web_widget: "#A5A8F5",
  social_dm: "#10B981",
  manual: "#F59E0B",
  business_card: "#64748B",
};

/** Stats row — lead count, viewings/deals/revenue for current + previous month. */
export async function getDashboardStats(
  supabase: SupabaseClient<Database>,
): Promise<DashboardStats> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [
    { count: totalLeads },
    { count: viewingsThisMonth },
    { count: viewingsLastMonth },
    { count: dealsInProgress },
    { count: dealsLastMonth },
    { data: revenueThis },
    { data: revenueLast },
    { count: leadsLastMonth },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("archived", false),
    supabase
      .from("viewings")
      .select("*", { count: "exact", head: true })
      .gte("scheduled_at", thisMonthStart)
      .eq("status", "scheduled"),
    supabase
      .from("viewings")
      .select("*", { count: "exact", head: true })
      .gte("scheduled_at", lastMonthStart)
      .lte("scheduled_at", lastMonthEnd)
      .eq("status", "attended"),
    supabase
      .from("deals")
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("completed","fallen_through")'),
    supabase
      .from("deals")
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("completed","fallen_through")')
      .lt("created_at", thisMonthStart),
    supabase
      .from("deals")
      .select("commission_amount")
      .eq("status", "completed")
      .gte("updated_at", thisMonthStart),
    supabase
      .from("deals")
      .select("commission_amount")
      .eq("status", "completed")
      .gte("updated_at", lastMonthStart)
      .lte("updated_at", lastMonthEnd),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("archived", false)
      .lt("created_at", thisMonthStart),
  ]);

  const revenueThisMonth = (revenueThis ?? []).reduce(
    (sum, d) => sum + (d.commission_amount ?? 0),
    0,
  );
  const revenueLastMonth = (revenueLast ?? []).reduce(
    (sum, d) => sum + (d.commission_amount ?? 0),
    0,
  );

  function delta(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  return {
    totalLeads: totalLeads ?? 0,
    viewingsThisMonth: viewingsThisMonth ?? 0,
    dealsInProgress: dealsInProgress ?? 0,
    revenueThisMonth,
    leadsDelta: delta(totalLeads ?? 0, leadsLastMonth ?? 0),
    viewingsDelta: delta(viewingsThisMonth ?? 0, viewingsLastMonth ?? 0),
    dealsDelta: delta(dealsInProgress ?? 0, dealsLastMonth ?? 0),
    revenueDelta: delta(revenueThisMonth, revenueLastMonth),
  };
}

/** Lead pipeline funnel — count per stage for active (non-archived) leads. */
export async function getLeadFunnel(
  supabase: SupabaseClient<Database>,
): Promise<FunnelStage[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("stage")
    .eq("archived", false);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.stage] = (counts[row.stage] ?? 0) + 1;
  }

  return FUNNEL_STAGES.map((s) => ({ ...s, count: counts[s.stage] ?? 0 }));
}

/** Last 6 months of commission revenue from completed deals. */
export async function getRevenueTrend(
  supabase: SupabaseClient<Database>,
): Promise<RevenuePoint[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("deals")
    .select("commission_amount, updated_at")
    .eq("status", "completed")
    .gte("updated_at", sixMonthsAgo.toISOString());

  if (error) throw error;

  // Aggregate by month
  const byMonth: Record<string, number> = {};
  for (const deal of data ?? []) {
    const d = new Date(deal.updated_at);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    byMonth[key] = (byMonth[key] ?? 0) + (deal.commission_amount ?? 0);
  }

  // Build ordered 6-month array
  const months: RevenuePoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const label = d.toLocaleDateString("en-US", { month: "short" });
    months.push({ month: label, revenue: byMonth[key] ?? 0 });
  }

  return months;
}

/** Lead sources breakdown for the donut chart. */
export async function getLeadSources(
  supabase: SupabaseClient<Database>,
): Promise<LeadSourcePoint[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("source")
    .eq("archived", false);

  if (error) throw error;

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of data ?? []) {
    counts[row.source] = (counts[row.source] ?? 0) + 1;
    total++;
  }

  if (total === 0) return [];

  const sourceLabels: Record<string, string> = {
    whatsapp: "WhatsApp",
    referral: "Referral",
    web_widget: "Website",
    social_dm: "Social DM",
    manual: "Manual",
    business_card: "Business Card",
  };

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({
      name: sourceLabels[source] ?? source,
      value: Math.round((count / total) * 100),
      color: SOURCE_COLORS[source] ?? "#64748B",
    }));
}

/** Next 5 upcoming scheduled viewings with property + lead names. */
export async function getUpcomingViewings(
  supabase: SupabaseClient<Database>,
): Promise<UpcomingViewing[]> {
  const { data, error } = await supabase
    .from("viewings")
    .select(
      `id, scheduled_at,
       properties(title, area),
       leads(full_name)`,
    )
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (error) throw error;

  return (data ?? []).map((v) => ({
    id: v.id,
    propertyTitle: (v.properties as { title: string; area: string | null } | null)?.title ?? "Property",
    propertyArea: (v.properties as { title: string; area: string | null } | null)?.area ?? null,
    leadName: (v.leads as { full_name: string } | null)?.full_name ?? "Lead",
    scheduledAt: v.scheduled_at,
  }));
}

/** Today's pending AI actions (not completed or dismissed). */
export async function getPendingAIActions(
  supabase: SupabaseClient<Database>,
): Promise<PendingAIAction[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("ai_actions")
    .select("id, title, priority, action_type, lead_id, deal_id")
    .eq("completed", false)
    .eq("dismissed", false)
    .eq("generated_date", today)
    .order("priority", { ascending: true })
    .limit(5);

  if (error) throw error;

  const priorityLabel: Record<string, string> = {
    urgent: "High priority · Due today",
    today: "Due today",
    this_week: "Due this week",
  };

  return (data ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    priority: a.priority,
    actionType: a.action_type,
    meta: priorityLabel[a.priority] ?? a.priority,
  }));
}

/** Run all dashboard queries in parallel — call this once from the page. */
export async function getAllDashboardData(supabase: SupabaseClient<Database>) {
  const [stats, funnel, revenue, sources, viewings, actions] = await Promise.all([
    getDashboardStats(supabase),
    getLeadFunnel(supabase),
    getRevenueTrend(supabase),
    getLeadSources(supabase),
    getUpcomingViewings(supabase),
    getPendingAIActions(supabase),
  ]);

  return { stats, funnel, revenue, sources, viewings, actions };
}
