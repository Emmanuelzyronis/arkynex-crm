import "server-only";
import { db } from "@/lib/db";
import {
  leads,
  viewings,
  deals,
  properties,
  aiActions,
} from "@/lib/db/schema";
import type { Lead, Viewing, Deal, AiAction } from "@/lib/db/schema";
import { eq, and, gte, lte, lt, desc, asc, sql } from "drizzle-orm";
import { CACHE_TAGS, cached } from "@/lib/cache";

// --- Types ---

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
  scheduledAt: Date;
};

export type PendingAIAction = {
  id: string;
  title: string;
  priority: string;
  actionType: string;
  meta: string;
};

// --- Constants ---

const FUNNEL_STAGES: Omit<FunnelStage, "count">[] = [
  { label: "New", stage: "new", color: "#D8DAFC" },
  { label: "Contacted", stage: "contacted", color: "#AEB4F8" },
  { label: "Viewing Scheduled", stage: "viewing_scheduled", color: "#8B5CF6" },
  { label: "Negotiating", stage: "negotiating", color: "#F59E0B" },
  { label: "Closed", stage: "closed", color: "#10B981" },
];

const SOURCE_COLORS: Record<string, string> = {
  referral: "#7C3AED",
  web_widget: "#A5A8F5",
  social_dm: "#10B981",
  manual: "#F59E0B",
  business_card: "#64748B",
};

// --- Queries ---

/** Stats row — lead count, viewings/deals/revenue for current + previous month. */
export async function getDashboardStats(
  agentId: string,
): Promise<DashboardStats> {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalLeadsResult,
    viewingsThisMonthResult,
    viewingsLastMonthResult,
    dealsInProgressResult,
    dealsLastMonthResult,
    revenueThisResult,
    revenueLastResult,
    leadsLastMonthResult,
  ] = await Promise.all([
    // Total active leads
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(and(eq(leads.agentId, agentId), eq(leads.archived, false))),
    // Viewings this month (scheduled)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(viewings)
      .where(
        and(
          eq(viewings.agentId, agentId),
          gte(viewings.scheduledAt, thisMonthStart),
          eq(viewings.status, "scheduled"),
        ),
      ),
    // Viewings last month (attended)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(viewings)
      .where(
        and(
          eq(viewings.agentId, agentId),
          gte(viewings.scheduledAt, lastMonthStart),
          lte(viewings.scheduledAt, lastMonthEnd),
          eq(viewings.status, "attended"),
        ),
      ),
    // Deals in progress (not completed or fallen through)
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(deals)
      .where(
        and(
          eq(deals.agentId, agentId),
          sql`${deals.status} NOT IN ('completed', 'fallen_through')`,
        ),
      ),
    // Deals last month in progress
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(deals)
      .where(
        and(
          eq(deals.agentId, agentId),
          sql`${deals.status} NOT IN ('completed', 'fallen_through')`,
          lt(deals.createdAt, thisMonthStart),
        ),
      ),
    // Revenue this month (completed deals)
    db
      .select({ commissionAmount: deals.commissionAmount })
      .from(deals)
      .where(
        and(
          eq(deals.agentId, agentId),
          eq(deals.status, "completed"),
          gte(deals.updatedAt, thisMonthStart),
        ),
      ),
    // Revenue last month
    db
      .select({ commissionAmount: deals.commissionAmount })
      .from(deals)
      .where(
        and(
          eq(deals.agentId, agentId),
          eq(deals.status, "completed"),
          gte(deals.updatedAt, lastMonthStart),
          lte(deals.updatedAt, lastMonthEnd),
        ),
      ),
    // Leads last month count
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(
        and(
          eq(leads.agentId, agentId),
          eq(leads.archived, false),
          lt(leads.createdAt, thisMonthStart),
        ),
      ),
  ]);

  const totalLeads = totalLeadsResult[0]?.count ?? 0;
  const viewingsThisMonth = viewingsThisMonthResult[0]?.count ?? 0;
  const viewingsLastMonth = viewingsLastMonthResult[0]?.count ?? 0;
  const dealsInProgress = dealsInProgressResult[0]?.count ?? 0;
  const dealsLastMonth = dealsLastMonthResult[0]?.count ?? 0;
  const leadsLastMonth = leadsLastMonthResult[0]?.count ?? 0;

  const revenueThisMonth = (revenueThisResult ?? []).reduce(
    (sum, d) => sum + (d.commissionAmount ?? 0),
    0,
  );
  const revenueLastMonth = (revenueLastResult ?? []).reduce(
    (sum, d) => sum + (d.commissionAmount ?? 0),
    0,
  );

  function delta(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  return {
    totalLeads,
    viewingsThisMonth,
    dealsInProgress,
    revenueThisMonth,
    leadsDelta: delta(totalLeads, leadsLastMonth),
    viewingsDelta: delta(viewingsThisMonth, viewingsLastMonth),
    dealsDelta: delta(dealsInProgress, dealsLastMonth),
    revenueDelta: delta(revenueThisMonth, revenueLastMonth),
  };
}

/** Lead pipeline funnel — count per stage for active (non-archived) leads. */
async function getLeadFunnelUncached(
  agentId: string,
): Promise<FunnelStage[]> {
  const data = await db
    .select({ stage: leads.stage, count: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(eq(leads.agentId, agentId), eq(leads.archived, false)))
    .groupBy(leads.stage);

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.stage] = row.count;
  }

  return FUNNEL_STAGES.map((s) => ({ ...s, count: counts[s.stage] ?? 0 }));
}

/** Last 6 months of commission revenue from completed deals. */
export async function getRevenueTrend(
  agentId: string,
): Promise<RevenuePoint[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const data = await db
    .select({ commissionAmount: deals.commissionAmount, updatedAt: deals.updatedAt })
    .from(deals)
    .where(
      and(
        eq(deals.agentId, agentId),
        eq(deals.status, "completed"),
        gte(deals.updatedAt, sixMonthsAgo),
      ),
    );

  // Aggregate by month
  const byMonth: Record<string, number> = {};
  for (const deal of data) {
    const d = new Date(deal.updatedAt);
    const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    byMonth[key] = (byMonth[key] ?? 0) + (deal.commissionAmount ?? 0);
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
async function getLeadSourcesUncached(
  agentId: string,
): Promise<LeadSourcePoint[]> {
  const data = await db
    .select({ source: leads.source, count: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(eq(leads.agentId, agentId), eq(leads.archived, false)))
    .groupBy(leads.source);

  const total = data.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return [];

  const sourceLabels: Record<string, string> = {
    referral: "Referral",
    web_widget: "Website",
    social_dm: "Social DM",
    manual: "Manual",
    business_card: "Business Card",
  };

  return data
    .sort((a, b) => b.count - a.count)
    .map((row) => ({
      name: sourceLabels[row.source!] ?? row.source!,
      value: Math.round((row.count / total) * 100),
      color: SOURCE_COLORS[row.source!] ?? "#64748B",
    }));
}

/** Next 5 upcoming scheduled viewings with property + lead names. */
export async function getUpcomingViewings(
  agentId: string,
): Promise<UpcomingViewing[]> {
  const rows = await db
    .select({
      id: viewings.id,
      scheduledAt: viewings.scheduledAt,
      propertyTitle: properties.title,
      propertyArea: properties.area,
      leadName: leads.fullName,
    })
    .from(viewings)
    .innerJoin(properties, eq(viewings.propertyId, properties.id))
    .innerJoin(leads, eq(viewings.leadId, leads.id))
    .where(
      and(
        eq(viewings.agentId, agentId),
        eq(viewings.status, "scheduled"),
        gte(viewings.scheduledAt, new Date()),
      ),
    )
    .orderBy(asc(viewings.scheduledAt))
    .limit(5);

  return rows.map((v) => ({
    id: v.id,
    propertyTitle: v.propertyTitle ?? "Property",
    propertyArea: v.propertyArea ?? null,
    leadName: v.leadName ?? "Lead",
    scheduledAt: v.scheduledAt,
  }));
}

/** Today's pending AI actions (not completed or dismissed). */
export async function getPendingAIActions(
  agentId: string,
): Promise<PendingAIAction[]> {
  const today = new Date().toISOString().split("T")[0];

  const data = await db
    .select()
    .from(aiActions)
    .where(
      and(
        eq(aiActions.agentId, agentId),
        eq(aiActions.completed, false),
        eq(aiActions.dismissed, false),
        sql`${aiActions.generatedDate}::text = ${today}`,
      ),
    )
    .orderBy(asc(aiActions.priority))
    .limit(5);

  const priorityLabel: Record<string, string> = {
    urgent: "High priority · Due today",
    today: "Due today",
    this_week: "Due this week",
  };

  return data.map((a) => ({
    id: a.id,
    title: a.title,
    priority: a.priority,
    actionType: a.actionType,
    meta: priorityLabel[a.priority] ?? a.priority,
  }));
}

/** Run all dashboard queries in parallel — call this once from the page. */
async function getAllDashboardDataUncached(agentId: string) {
  const [stats, funnel, revenue, sources, upcomingViewings, actions] =
    await Promise.all([
      getDashboardStats(agentId),
      getLeadFunnel(agentId),
      getRevenueTrend(agentId),
      getLeadSources(agentId),
      getUpcomingViewings(agentId),
      getPendingAIActions(agentId),
    ]);

  return {
    stats,
    funnel,
    revenue,
    sources,
    viewings: upcomingViewings,
    actions,
  };
}

/** Cached dashboard read models (60s TTL, purged via the `dashboard` tag). */
export const getLeadFunnel = cached(getLeadFunnelUncached, ["lead-funnel"], {
  tags: [CACHE_TAGS.dashboard],
});
export const getLeadSources = cached(getLeadSourcesUncached, ["lead-sources"], {
  tags: [CACHE_TAGS.dashboard],
});
export const getAllDashboardData = cached(
  getAllDashboardDataUncached,
  ["dashboard-data"],
  { tags: [CACHE_TAGS.dashboard] },
);
