import { redirect } from "next/navigation";

import { getAllReportData } from "@/lib/db/queries/reports";
import { LeadFunnel } from "@/components/dashboard/lead-funnel";
import { LeadSources } from "@/components/dashboard/lead-sources";
import { getLeadFunnel, getLeadSources } from "@/lib/db/queries/dashboard";
import { ReportStatsSection } from "@/components/reports/report-stats";
import { RevenueTrendChart } from "@/components/reports/revenue-trend-chart";
import { DealStageChart } from "@/components/reports/deal-stage-chart";
import { ViewingOutcomes } from "@/components/reports/viewing-outcomes";
import { TopPropertiesTable } from "@/components/reports/top-properties-table";
import { requireUser } from "@/lib/auth/user";

export default async function ReportsPage() {
  const userId = await requireUser();

  const [
    { stats, revenue, dealStages, viewingOutcomes, topProperties },
    funnel,
    sources,
  ] = await Promise.all([
    getAllReportData(userId),
    getLeadFunnel(userId),
    getLeadSources(userId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Reports</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Pipeline, revenue and activity across your business.
        </p>
      </div>

      <ReportStatsSection stats={stats} />
      <RevenueTrendChart data={revenue} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadFunnel stages={funnel} />
        <LeadSources sources={sources} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DealStageChart data={dealStages} />
        <ViewingOutcomes data={viewingOutcomes} />
      </div>

      <TopPropertiesTable properties={topProperties} />
    </div>
  );
}
