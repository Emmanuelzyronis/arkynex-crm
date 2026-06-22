import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { CalendarDays, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getDeals } from "@/lib/supabase/queries/deals";
import { updateDealStatus, deleteDeal } from "@/lib/supabase/mutations/deals";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/mock-leads";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  negotiating: { label: "Negotiating", color: "#F59E0B" },
  offer_accepted: { label: "Offer Accepted", color: "#3B82F6" },
  docs_processing: { label: "Docs Processing", color: "#8B5CF6" },
  completed: { label: "Completed", color: "#10B981" },
  fallen_through: { label: "Fallen Through", color: "#EF4444" },
};

const COLUMN_ORDER = ["negotiating", "offer_accepted", "docs_processing", "completed", "fallen_through"];

const NEXT_STATUS: Record<string, string> = {
  negotiating: "offer_accepted",
  offer_accepted: "docs_processing",
  docs_processing: "completed",
};

function formatNaira(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  return `₦${Math.round(n / 1_000_000)}M`;
}

function probabilityColor(p: number) {
  if (p >= 0.7) return "#10B981";
  if (p >= 0.4) return "#F59E0B";
  return "#EF4444";
}

export default async function DealsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const deals = await getDeals(supabase);

  const activeDeals = deals.filter((d) => !["completed", "fallen_through"].includes(d.status));
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.agreed_price ?? d.asking_price), 0);
  const commissionEarned = deals
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + (d.commission_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Deals</h1>
          <p className="mt-1 text-sm text-ink-muted">{deals.length} deal{deals.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button asChild>
          <Link href="/deals/new">
            <Plus className="h-4 w-4" />
            New Deal
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Deals", value: String(activeDeals.length) },
          { label: "Pipeline Value", value: formatNaira(pipelineValue) },
          { label: "Commission Earned", value: formatNaira(commissionEarned) },
          { label: "Deals Closed", value: String(deals.filter((d) => d.status === "completed").length) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-line bg-card p-5">
            <p className="text-sm text-ink-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
          </div>
        ))}
      </div>

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card px-5 py-12 text-center text-sm text-ink-muted">
          No deals yet — create your first one to start tracking negotiations.
        </div>
      ) : (
        /* Kanban board */
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMN_ORDER.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const items = deals.filter((d) => d.status === status);

            return (
              <div key={status} className="flex w-72 shrink-0 flex-col gap-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <h2 className="text-sm font-semibold text-ink">{cfg.label}</h2>
                  <span className="text-xs text-ink-muted">{items.length}</span>
                </div>

                <div className="space-y-3">
                  {items.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-ink-muted">
                      No deals
                    </div>
                  )}

                  {items.map((deal) => {
                    const lead = deal.leads as { full_name: string } | null;
                    const property = deal.properties as { title: string; area: string | null; price: number } | null;
                    const value = deal.agreed_price ?? deal.asking_price;
                    const prob = deal.closing_probability ?? 0.3;
                    const nextStatus = NEXT_STATUS[deal.status];
                    const nextCfg = nextStatus ? STATUS_CONFIG[nextStatus] : null;

                    return (
                      <div key={deal.id} className="rounded-2xl border border-line bg-card p-4">
                        <p className="truncate text-sm font-medium text-ink">{property?.title ?? "Property"}</p>
                        <p className="text-xs text-ink-muted">{property?.area ?? ""}</p>

                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {initials(lead?.full_name ?? "?")}
                          </div>
                          <span className="truncate text-xs text-ink-muted">{lead?.full_name ?? "Lead"}</span>
                        </div>

                        <div className="mt-3">
                          <p className="text-base font-semibold text-ink">{formatNaira(value)}</p>
                          {deal.commission_amount && (
                            <p className="text-xs text-ink-muted">Commission {formatNaira(deal.commission_amount)}</p>
                          )}
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-ink-muted">
                            <span>Probability</span>
                            <span className="font-medium text-ink">{Math.round(prob * 100)}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface">
                            <div className="h-1.5 rounded-full" style={{ width: `${prob * 100}%`, backgroundColor: probabilityColor(prob) }} />
                          </div>
                        </div>

                        {deal.expected_close_date && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(deal.expected_close_date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                          </div>
                        )}

                        <div className="mt-3 flex flex-col gap-2">
                          {nextCfg && (
                            <form>
                              <input type="hidden" name="dealId" value={deal.id} />
                              <input type="hidden" name="status" value={nextStatus} />
                              <button
                                type="submit"
                                formAction={updateDealStatus}
                                className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
                              >
                                Move to {nextCfg.label}
                              </button>
                            </form>
                          )}
                          {deal.status !== "completed" && deal.status !== "fallen_through" && (
                            <form>
                              <input type="hidden" name="dealId" value={deal.id} />
                              <input type="hidden" name="status" value="fallen_through" />
                              <button
                                type="submit"
                                formAction={updateDealStatus}
                                className="w-full rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-status-lost transition-colors hover:bg-status-lost/5"
                              >
                                Mark fallen through
                              </button>
                            </form>
                          )}
                          <form>
                            <input type="hidden" name="dealId" value={deal.id} />
                            <button type="submit" formAction={deleteDeal} className="flex w-full items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs text-ink-muted/50 transition-colors hover:text-status-lost">
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
