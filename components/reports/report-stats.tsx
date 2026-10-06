import { Handshake, Percent, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { ReportStatsData } from "@/lib/db/queries/reports";
import { formatMoneyCompact } from "@/lib/currency";


function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

export function ReportStatsSection({ stats }: { stats: ReportStatsData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Revenue" value={formatMoneyCompact(stats.totalRevenue)} icon={Wallet} />
      <StatCard label="Deals Closed" value={String(stats.dealsClosed)} icon={Handshake} />
      <StatCard label="Avg Commission" value={formatMoneyCompact(stats.avgCommission)} icon={Percent} />
      <StatCard label="Conversion Rate" value={`${Math.round(stats.conversionRate * 100)}%`} icon={TrendingUp} />
    </div>
  );
}
