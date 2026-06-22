"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { ReportDealStage } from "@/lib/supabase/queries/reports";

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
  return `₦${(value / 1_000_000).toFixed(0)}M`;
}

export function DealStageChart({ data }: { data: ReportDealStage[] }) {
  const isEmpty = data.length === 0;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
      <h2 className="text-base font-semibold text-ink">Pipeline Value by Stage</h2>
      <p className="mt-1 text-sm text-ink-muted">Total value of deals in each stage</p>

      {isEmpty ? (
        <div className="mt-4 flex items-center justify-center py-12">
          <p className="text-sm text-ink-muted">No deals yet.</p>
        </div>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} tickFormatter={formatCurrency} />
              <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} width={120} tick={{ fill: "#374151", fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Value"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12, boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                {data.map((entry) => (
                  <Cell key={entry.stage} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
