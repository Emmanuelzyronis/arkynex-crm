"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatMoneyCompact } from "@/lib/currency";
import type { LeadWithAssignee } from "@/lib/db/queries/leads";
import {
  avatarPalette,
  initials,
  leadStageFilters,
  scoreColor,
  sourceConfig,
  stageConfig,
} from "@/lib/mock-leads";

function formatBudgetFromDb(lead: LeadWithAssignee) {
  const min = lead.budgetMin;
  const max = lead.budgetMax;
  if (!min && !max) return null;
  const fmt = (n: number) => formatMoneyCompact(n);
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

export function LeadsTable({ leads }: { leads: LeadWithAssignee[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    const filter = leadStageFilters.find((f) => f.value === activeFilter);
    const q = query.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesStage =
        !filter || filter.value === "all" || filter.stages.includes(lead.stage as never);
      const matchesQuery =
        q === "" ||
        lead.fullName.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        (lead.locationPrefs ?? []).some((area) => area.toLowerCase().includes(q));
      return matchesStage && matchesQuery;
    });
  }, [leads, query, activeFilter]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, area..." className="pl-9" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {leadStageFilters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "border-primary bg-primary/10 text-primary" : "border-line text-ink-muted hover:border-ink-muted",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-card">
        <div className="hidden border-b border-line px-5 py-3 text-xs font-medium uppercase tracking-wide text-ink-muted sm:grid sm:grid-cols-12 sm:gap-4">
          <span className="col-span-4">Lead</span>
          <span className="col-span-3">Requirement</span>
          <span className="col-span-2">Stage</span>
          <span className="col-span-1">Score</span>
          <span className="col-span-2">Contact / Owner</span>
        </div>

        <ul className="divide-y divide-line">
          {filtered.map((lead, i) => {
            const stage = stageConfig[lead.stage as keyof typeof stageConfig] ?? { label: lead.stage, color: "#64748B" };
            const source = sourceConfig[lead.source as keyof typeof sourceConfig];
            const SourceIcon = source?.icon;
            const budget = formatBudgetFromDb(lead);

            return (
              <li
                key={lead.id}
                onClick={() => router.push(`/leads/${lead.id}`)}
                className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition-colors hover:bg-surface sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:col-span-4">
                  <div className="relative shrink-0">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold", avatarPalette[i % avatarPalette.length])}>
                      {initials(lead.fullName)}
                    </div>
                    {SourceIcon && (
                      <span title={source.label} className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-card bg-surface text-ink-muted">
                        <SourceIcon className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{lead.fullName}</p>
                    <p className="truncate text-xs text-ink-muted">{lead.phone}</p>
                  </div>
                </div>

                <div className="text-sm sm:col-span-3">
                  <p className="text-ink">
                    {lead.bedrooms ? `${lead.bedrooms} bed ` : ""}
                    {lead.propertyType ?? "Any"}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {[budget, (lead.locationPrefs ?? []).join(", ")].filter(Boolean).join(" · ")}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:contents">
                  <div className="sm:col-span-2">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${stage.color}1A`, color: stage.color }}>
                      {stage.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-ink sm:col-span-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: scoreColor(lead.score) }} />
                    {lead.score}
                  </div>
                  <div className="text-sm text-ink-muted sm:col-span-2">
                    <p>
                      {lead.lastContactedAt
                        ? new Date(lead.lastContactedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "—"}
                    </p>
                    {lead.assignedToName && (
                      <p className="truncate text-xs font-medium text-primary">{lead.assignedToName}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            {leads.length === 0 ? "No leads yet — add your first one!" : "No leads match your search."}
          </p>
        )}
      </div>
    </div>
  );
}
