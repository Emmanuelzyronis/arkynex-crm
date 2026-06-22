"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { LeadSourcePoint } from "@/lib/supabase/queries/dashboard";

export function LeadSources({ sources }: { sources: LeadSourcePoint[] }) {
  const isEmpty = sources.length === 0;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Lead Sources</h2>
        <span className="text-xs text-ink-muted">All time</span>
      </div>

      {isEmpty ? (
        <div className="mt-4 flex items-center justify-center py-8">
          <p className="text-sm text-ink-muted">No leads yet.</p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-6">
          <div className="h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {sources.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E5E7EB",
                    fontSize: 12,
                    boxShadow: "0 4px 12px rgba(17,24,39,0.06)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex-1 space-y-3">
            {sources.map((entry) => (
              <li key={entry.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-medium text-ink-muted">{entry.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
