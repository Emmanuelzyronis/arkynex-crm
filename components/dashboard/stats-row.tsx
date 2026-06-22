import { CalendarCheck, Handshake, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DashboardStats } from "@/lib/supabase/queries/dashboard";

function formatNaira(n: number) {
  if (n === 0) return "₦0";
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  return `₦${(n / 1_000_000).toFixed(1)}M`;
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  isRevenue,
}: {
  label: string;
  value: number;
  delta: number;
  icon: LucideIcon;
  isRevenue?: boolean;
}) {
  const positive = delta >= 0;

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        {isRevenue ? formatNaira(value) : value}
      </p>
      {delta !== 0 ? (
        <p className={`mt-1 text-xs font-medium ${positive ? "text-status-closed" : "text-status-lost"}`}>
          {positive ? "↑" : "↓"} {Math.abs(delta)}% vs last month
        </p>
      ) : (
        <p className="mt-1 text-xs text-ink-muted">No change vs last month</p>
      )}
    </div>
  );
}

export function StatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Leads" value={stats.totalLeads} delta={stats.leadsDelta} icon={Users} />
      <StatCard label="Viewings (This Month)" value={stats.viewingsThisMonth} delta={stats.viewingsDelta} icon={CalendarCheck} />
      <StatCard label="Deals in Progress" value={stats.dealsInProgress} delta={stats.dealsDelta} icon={Handshake} />
      <StatCard label="Revenue (This Month)" value={stats.revenueThisMonth} delta={stats.revenueDelta} icon={Wallet} isRevenue />
    </div>
  );
}
