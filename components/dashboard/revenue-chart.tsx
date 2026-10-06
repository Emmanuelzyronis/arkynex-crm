"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { RevenuePoint } from "@/lib/db/queries/dashboard";
import { formatMoneyCompact } from "@/lib/currency";


export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const lastMonth = data[data.length - 1]?.revenue ?? 0;
  const prevMonth = data[data.length - 2]?.revenue ?? 0;
  const delta = prevMonth > 0 ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100) : 0;
  const isEmpty = totalRevenue === 0;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Revenue Overview</h2>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            {formatMoneyCompact(lastMonth)}
          </p>
          {delta !== 0 ? (
            <p className={`mt-1 text-xs font-medium ${delta >= 0 ? "text-status-closed" : "text-status-lost"}`}>
              {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last month
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">No change vs last month</p>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="mt-6 flex items-center justify-center py-8">
          <p className="text-sm text-ink-muted">No commission revenue yet — complete your first deal to see the chart.</p>
        </div>
      ) : (
        <div className="mt-6 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -16, right: 4, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B5FEF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#5B5FEF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={formatMoneyCompact}
                width={48}
              />
              <Tooltip
                formatter={(value: number) => [formatMoneyCompact(value), "Revenue"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(17,24,39,0.06)",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#5B5FEF"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
