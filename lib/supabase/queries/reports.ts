import type { Database, SupaClient } from "@/lib/supabase/types";

export type ReportStatsData = {
  totalRevenue: number;
  dealsClosed: number;
  avgCommission: number;
  conversionRate: number;
};

export type ReportRevenuePoint = { month: string; revenue: number };
export type ReportDealStage = { stage: string; count: number; value: number; color: string };
export type ReportViewingOutcome = { outcome: string; count: number; color: string };
export type ReportTopProperty = {
  id: string;
  title: string;
  area: string | null;
  city: string;
  inquiryCount: number;
  viewingCount: number;
  status: string;
};

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

export async function getReportStats(
  supabase: SupaClient,
): Promise<ReportStatsData> {
  const [
    { data: completed },
    { count: totalLeads },
    { count: closedLeads },
  ] = await Promise.all([
    supabase.from("deals").select("commission_amount").eq("status", "completed"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("archived", false),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("stage", "closed"),
  ]);

  const totalRevenue = (completed ?? []).reduce((sum, d) => sum + (d.commission_amount ?? 0), 0);
  const dealsClosed = completed?.length ?? 0;
  const avgCommission = dealsClosed > 0 ? Math.round(totalRevenue / dealsClosed) : 0;
  const conversionRate =
    totalLeads && totalLeads > 0 ? Math.round(((closedLeads ?? 0) / totalLeads) * 100) / 100 : 0;

  return { totalRevenue, dealsClosed, avgCommission, conversionRate };
}

export async function getReportRevenueTrend(
  supabase: SupaClient,
  months = 12,
): Promise<ReportRevenuePoint[]> {
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("deals")
    .select("commission_amount, updated_at")
    .eq("status", "completed")
    .gte("updated_at", start.toISOString());

  if (error) throw error;

  const byMonth: Record<string, number> = {};
  for (const deal of data ?? []) {
    const d = new Date(deal.updated_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + (deal.commission_amount ?? 0);
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
  supabase: SupaClient,
): Promise<ReportDealStage[]> {
  const { data, error } = await supabase
    .from("deals")
    .select("status, agreed_price, asking_price");

  if (error) throw error;

  const byStatus: Record<string, { count: number; value: number }> = {};
  for (const deal of data ?? []) {
    const s = deal.status;
    const v = deal.agreed_price ?? deal.asking_price;
    if (!byStatus[s]) byStatus[s] = { count: 0, value: 0 };
    byStatus[s].count++;
    byStatus[s].value += v;
  }

  return Object.entries(byStatus).map(([status, { count, value }]) => ({
    stage: DEAL_STAGE_LABELS[status] ?? status,
    count,
    value,
    color: DEAL_STAGE_COLORS[status] ?? "#64748B",
  }));
}

export async function getReportViewingOutcomes(
  supabase: SupaClient,
): Promise<ReportViewingOutcome[]> {
  const { data, error } = await supabase.from("viewings").select("status");
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  return Object.entries(counts).map(([status, count]) => ({
    outcome: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
    count,
    color: VIEWING_OUTCOME_COLORS[status] ?? "#64748B",
  }));
}

export async function getReportTopProperties(
  supabase: SupaClient,
  limit = 5,
): Promise<ReportTopProperty[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, title, area, city, inquiry_count, viewing_count, status")
    .order("inquiry_count", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    area: p.area,
    city: p.city,
    inquiryCount: p.inquiry_count,
    viewingCount: p.viewing_count,
    status: p.status,
  }));
}

export async function getAllReportData(supabase: SupaClient) {
  const [stats, revenue, dealStages, viewingOutcomes, topProperties] = await Promise.all([
    getReportStats(supabase),
    getReportRevenueTrend(supabase),
    getReportDealStages(supabase),
    getReportViewingOutcomes(supabase),
    getReportTopProperties(supabase),
  ]);

  return { stats, revenue, dealStages, viewingOutcomes, topProperties };
}
