import { mockProperties } from "@/lib/mock-properties";

// 12-month trend ending at the same $412K shown on the dashboard's "This Month".
export const revenueTrend: { month: string; revenue: number }[] = [
  { month: "Jun", revenue: 6_500_000 },
  { month: "Jul", revenue: 7_200_000 },
  { month: "Aug", revenue: 6_900_000 },
  { month: "Sep", revenue: 8_100_000 },
  { month: "Oct", revenue: 8_800_000 },
  { month: "Nov", revenue: 9_500_000 },
  { month: "Dec", revenue: 10_100_000 },
  { month: "Jan", revenue: 8_700_000 },
  { month: "Feb", revenue: 9_300_000 },
  { month: "Mar", revenue: 10_800_000 },
  { month: "Apr", revenue: 11_600_000 },
  { month: "May", revenue: 12_400_000 },
];

export const dealStageBreakdown: { stage: string; count: number; value: number; color: string }[] = [
  { stage: "Negotiating", count: 8, value: 1_150_000_000, color: "#F59E0B" },
  { stage: "Offer Accepted", count: 5, value: 980_000_000, color: "#3B82F6" },
  { stage: "Docs Processing", count: 3, value: 420_000_000, color: "#8B5CF6" },
  { stage: "Completed", count: 14, value: 1_860_000_000, color: "#10B981" },
  { stage: "Fallen Through", count: 4, value: 540_000_000, color: "#EF4444" },
];

export const viewingOutcomes: { outcome: string; count: number; color: string }[] = [
  { outcome: "Attended", count: 24, color: "#10B981" },
  { outcome: "Scheduled", count: 8, color: "#3B82F6" },
  { outcome: "No Show", count: 5, color: "#EF4444" },
  { outcome: "Cancelled", count: 3, color: "#64748B" },
];

export const topProperties = [...mockProperties]
  .sort((a, b) => b.inquiryCount - a.inquiryCount)
  .slice(0, 5);

export const reportStats = {
  totalRevenue: revenueTrend.reduce((sum, m) => sum + m.revenue, 0),
  dealsClosed: 14,
  avgCommission: 6_400_000,
  conversionRate: 0.18,
};

export const dateRangeOptions = ["Last 3 Months", "Last 6 Months", "Last 12 Months", "This Year"];
