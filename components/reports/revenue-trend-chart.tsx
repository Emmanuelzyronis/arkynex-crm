"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ReportRevenuePoint } from "@/lib/supabase/queries/reports";

function formatCurrency(value: number) {
  if (value === 0) return "₦0";
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  return `₦${(value / 1_000_000).toFixed(0)}M`;
}

export function RevenueTrendChart({ data }: { data: ReportRevenuePoint[] }) {
  const isEmpty = data.every((d) => d.revenue === 0);

  return (
    <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
      <h2 className="text-base font-semibold text-ink">Revenue Trend</h2>
      <p className="mt-1 text-sm text-ink-muted">Last 12 months</p>

      {isEmpty ? (
        <div className="mt-4 flex items-center justify-center py-12">
          <p className="text-sm text-ink-muted">No commission revenue yet.</p>
        </div>
      ) : (
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="reportsRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B5FEF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#5B5FEF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} tickFormatter={formatCurrency} width={48} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#5B5FEF" strokeWidth={2} fill="url(#reportsRevenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
