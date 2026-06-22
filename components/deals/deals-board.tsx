import { DealCard } from "@/components/deals/deal-card";
import { formatNaira } from "@/lib/mock-leads";
import { dealColumnOrder, dealStatusConfig, mockDeals } from "@/lib/mock-deals";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

function computeStats() {
  const active = mockDeals.filter(
    (d) => d.status !== "completed" && d.status !== "fallen_through",
  );
  const pipelineValue = active.reduce((sum, d) => sum + (d.agreedPrice ?? d.askingPrice), 0);
  const weightedValue = active.reduce(
    (sum, d) => sum + (d.agreedPrice ?? d.askingPrice) * d.closingProbability,
    0,
  );
  const commissionEarned = mockDeals
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + (d.commissionAmount ?? 0), 0);

  return { activeCount: active.length, pipelineValue, weightedValue, commissionEarned };
}

export function DealsBoard() {
  const stats = computeStats();

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Deals" value={String(stats.activeCount)} />
        <StatCard label="Pipeline Value" value={formatNaira(stats.pipelineValue)} />
        <StatCard label="Weighted Value" value={formatNaira(stats.weightedValue)} />
        <StatCard label="Commission Earned" value={formatNaira(stats.commissionEarned)} />
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {dealColumnOrder.map((status) => {
          const config = dealStatusConfig[status];
          const items = mockDeals.filter((d) => d.status === status);

          return (
            <div key={status} className="flex w-72 shrink-0 flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} />
                <h2 className="text-sm font-semibold text-ink">{config.label}</h2>
                <span className="text-xs text-ink-muted">{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
                {items.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-ink-muted">
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
