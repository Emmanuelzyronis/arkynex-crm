"use client";

import { useMemo, useState } from "react";
import { Building2, Search, Star } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ViewingWithDetails } from "@/lib/db/queries/viewings";

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "#3B82F6" },
  attended: { label: "Attended", color: "#10B981" },
  no_show: { label: "No Show", color: "#EF4444" },
  cancelled: { label: "Cancelled", color: "#64748B" },
};

const statusFilters = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "attended", label: "Attended" },
  { value: "no_show", label: "No Show" },
  { value: "cancelled", label: "Cancelled" },
];

function groupViewings(viewings: ViewingWithDetails[]) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeekEnd = new Date(now);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

  const groups: Record<string, ViewingWithDetails[]> = {
    Today: [],
    Tomorrow: [],
    "This Week": [],
    Past: [],
  };

  for (const v of viewings) {
    const d = new Date(v.scheduledAt);
    if (d.toDateString() === now.toDateString()) groups["Today"].push(v);
    else if (d.toDateString() === tomorrow.toDateString()) groups["Tomorrow"].push(v);
    else if (d > now && d <= nextWeekEnd) groups["This Week"].push(v);
    else groups["Past"].push(v);
  }

  return groups;
}

function formatTime(iso: string | Date) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDate(iso: string | Date) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i <= rating ? "fill-status-negotiating text-status-negotiating" : "text-line")} />
      ))}
    </div>
  );
}

export function ViewingsList({
  viewings,
  updateStatus,
}: {
  viewings: ViewingWithDetails[];
  updateStatus: (formData: FormData) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return viewings.filter((v) => {
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      const leadName = (v.lead as { fullName: string } | null)?.fullName?.toLowerCase() ?? "";
      const propertyTitle = (v.property as { title: string } | null)?.title?.toLowerCase() ?? "";
      const matchesQuery = q === "" || leadName.includes(q) || propertyTitle.includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [viewings, query, statusFilter]);

  const groups = groupViewings(filtered);
  const groupOrder = ["Today", "Tomorrow", "This Week", "Past"] as const;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lead or property..." className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                statusFilter === f.value ? "border-primary bg-primary/10 text-primary" : "border-line text-ink-muted hover:border-ink-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-card px-5 py-10 text-center text-sm text-ink-muted">
          {viewings.length === 0 ? "No viewings scheduled yet — schedule your first one!" : "No viewings match your filters."}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groupOrder.map((group) => {
            const items = groups[group];
            if (items.length === 0) return null;
            return (
              <section key={group}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{group}</h2>
                <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
                  {items.map((viewing) => {
                    const cfg = statusConfig[viewing.status] ?? { label: viewing.status, color: "#64748B" };
                    const lead = viewing.lead as { fullName: string; phone: string } | null;
                    const property = viewing.property as { title: string; area: string | null } | null;

                    return (
                      <li key={viewing.id} className="flex flex-col gap-3 px-5 py-4 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4">
                        {/* Time */}
                        <div className="flex flex-col sm:col-span-2">
                          <p className="text-sm font-semibold text-ink">{formatTime(viewing.scheduledAt)}</p>
                          {group !== "Today" && group !== "Tomorrow" && (
                            <p className="text-xs text-ink-muted">{formatDate(viewing.scheduledAt)}</p>
                          )}
                        </div>

                        {/* Property */}
                        <div className="flex items-center gap-3 sm:col-span-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{property?.title ?? "Property"}</p>
                            <p className="truncate text-xs text-ink-muted">{property?.area ?? ""}</p>
                          </div>
                        </div>

                        {/* Lead */}
                        <div className="flex items-center gap-2 sm:col-span-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {(lead?.fullName ?? "?").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-ink">{lead?.fullName ?? "Lead"}</p>
                            <p className="truncate text-xs text-ink-muted">{lead?.phone ?? ""}</p>
                          </div>
                        </div>

                        {/* Status + rating */}
                        <div className="flex items-center justify-between gap-3 sm:col-span-3 sm:flex-col sm:items-end">
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${cfg.color}1A`, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          {viewing.rating != null && <StarRating rating={viewing.rating} />}
                        </div>

                        {/* Notes */}
                        {viewing.agentNotes && (
                          <div className="rounded-lg bg-surface px-3 py-2 text-xs text-ink-muted sm:col-span-12">
                            {viewing.agentNotes}
                          </div>
                        )}

                        {/* Quick status update for scheduled viewings */}
                        {viewing.status === "scheduled" && (
                          <div className="flex gap-2 sm:col-span-12">
                            {["attended", "no_show", "cancelled"].map((s) => (
                              <form key={s}>
                                <input type="hidden" name="viewingId" value={viewing.id} />
                                <input type="hidden" name="status" value={s} />
                                <button
                                  type="submit"
                                  formAction={updateStatus}
                                  className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-muted capitalize transition-colors hover:bg-surface hover:text-ink"
                                >
                                  Mark {s.replace("_", " ")}
                                </button>
                              </form>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
