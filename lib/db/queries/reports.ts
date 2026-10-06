import "server-only";
import { db } from "@/lib/db";
import {
  deals,
  leads,
  viewings,
  properties,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

// --- Types ---

export type ReportStatsData = {
  totalRevenue: number;
  dealsClosed: number;
  avgCommission: number;
  conversionRate: number;
};

export type ReportRevenuePoint = { month: string; revenue: number };
export type ReportDealStage = {
  stage: string;
  count: number;
  value: number;
  color: string;
};
export type ReportViewingOutcome = {
  outcome: string;
  count: number;
  color: string;
};
export type ReportTopProperty = {
  id: string;
  title: string;
  area: string | null;
  city: string;
  inquiryCount: number;
  viewingCount: number;
  status: string;
};

// --- Constants ---

const DEAL_STAGE_COLORS: Record<string, string> = {
  negotiating: "#F59E0B",
  offer_accepted: "#3B82F6",
  docs_processing: "#8B5CF6",
  completed: "#10B981",
  fallen_through: "#EF4444",
};

const DEAL_STAGE_LABELS: Record<string, string> = {
  negotiating: "Negotiating",
  offer_accepted: "Offer Accepted",
  docs_processing: "Docs Processing",
  completed: "Completed",
  fallen_through: "Fallen Through",
};

const VIEWING_OUTCOME_COLORS: Record<string, string> = {
  attended: "#10B981",
  scheduled: "#3B82F6",
  no_show: "#EF4444",
  cancelled: "#64748B",
};

// --- Queries ---

export async function getReportStats(
  agentId: string,
): Promise<ReportStatsData> {
  const [completedResult, totalLeadsResult, closedLeadsResult] =
    await Promise.all([
      db
        .select({ commissionAmount: deals.commissionAmount })
        .from(deals)
        .where(and(eq(deals.agentId, agentId), eq(deals.status, "completed"))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(and(eq(leads.agentId, agentId), eq(leads.archived, false))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(
          and(
            eq(leads.agentId, agentId),
            eq(leads.stage, "closed"),
          ),
        ),
    ]);

  const totalRevenue = (completedResult ?? []).reduce(
    (sum, d) => sum + (d.commissionAmount ?? 0),
    0,
  );
  const dealsClosed = completedResult?.length ?? 0;
  const avgCommission =
    dealsClosed > 0 ? Math.round(totalRevenue / dealsClosed) : 0;
  const totalLeads = totalLeadsResult[0]?.count ?? 0;
  const closedLeads = closedLeadsResult[0]?.count ?? 0;
  const conversionRate =
    totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) / 100 : 0;

  return { totalRevenue, dealsClosed, avgCommission, conversionRate };
}

export async function getReportRevenueTrend(
  agentId: string,
  months = 12,
): Promise<ReportRevenuePoint[]> {
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const data = await db
    .select({ commissionAmount: deals.commissionAmount, updatedAt: deals.updatedAt })
    .from(deals)
    .where(
      and(
        eq(deals.agentId, agentId),
        eq(deals.status, "completed"),
        gte(deals.updatedAt, start),
      ),
    );

  const byMonth: Record<string, number> = {};
  for (const deal of data) {
    const d = new Date(deal.updatedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + (deal.commissionAmount ?? 0);
  }

  const result: ReportRevenuePoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      revenue: byMonth[key] ?? 0,
    });
  }
  return result;
}

export async function getReportDealStages(
  agentId: string,
): Promise<ReportDealStage[]> {
  const data = await db
    .select({
      status: deals.status,
      agreedPrice: deals.agreedPrice,
      askingPrice: deals.askingPrice,
    })
    .from(deals)
    .where(eq(deals.agentId, agentId));

  const byStatus: Record<string, { count: number; value: number }> = {};
  for (const deal of data) {
    const s = deal.status;
    const v = deal.agreedPrice ?? deal.askingPrice;
    if (!byStatus[s]) byStatus[s] = { count: 0, value: 0 };
    byStatus[s].count++;
    byStatus[s].value += v ?? 0;
  }

  return Object.entries(byStatus).map(([status, { count, value }]) => ({
    stage: DEAL_STAGE_LABELS[status] ?? status,
    count,
    value,
    color: DEAL_STAGE_COLORS[status] ?? "#64748B",
  }));
}

export async function getReportViewingOutcomes(
  agentId: string,
): Promise<ReportViewingOutcome[]> {
  const data = await db
    .select({ status: viewings.status, count: sql<number>`count(*)::int` })
    .from(viewings)
    .where(eq(viewings.agentId, agentId))
    .groupBy(viewings.status);

  return data.map((row) => ({
    outcome: row.status.charAt(0).toUpperCase() + row.status.slice(1).replace("_", " "),
    count: row.count,
    color: VIEWING_OUTCOME_COLORS[row.status] ?? "#64748B",
  }));
}

export async function getReportTopProperties(
  agentId: string,
  limit = 5,
): Promise<ReportTopProperty[]> {
  const data = await db
    .select()
    .from(properties)
    .where(eq(properties.agentId, agentId))
    .orderBy(desc(properties.inquiryCount))
    .limit(limit);

  return data.map((p) => ({
    id: p.id,
    title: p.title,
    area: p.area,
    city: p.city,
    inquiryCount: p.inquiryCount,
    viewingCount: p.viewingCount,
    status: p.status,
  }));
}

export async function getAllReportData(agentId: string) {
  const [stats, revenue, dealStages, viewingOutcomes, topProperties] =
    await Promise.all([
      getReportStats(agentId),
      getReportRevenueTrend(agentId),
      getReportDealStages(agentId),
      getReportViewingOutcomes(agentId),
      getReportTopProperties(agentId),
    ]);

  return { stats, revenue, dealStages, viewingOutcomes, topProperties };
}
