import { CalendarDays } from "lucide-react";

import { initials } from "@/lib/mock-leads";
import { formatMoneyCompact } from "@/lib/currency";
import { closeDateLabel, probabilityColor, type Deal } from "@/lib/mock-deals";
import { cn } from "@/lib/utils";

export function DealCard({ deal }: { deal: Deal }) {
  const value = deal.agreedPrice ?? deal.askingPrice;
  const hasDiscount = deal.agreedPrice != null && deal.agreedPrice !== deal.askingPrice;

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card p-4",
        deal.status === "fallen_through" && "opacity-70",
      )}
    >
      <p className="truncate text-sm font-medium text-ink">{deal.propertyTitle}</p>
      <p className="text-xs text-ink-muted">{deal.propertyArea}</p>

      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
          {initials(deal.leadName)}
        </div>
        <span className="truncate text-xs text-ink-muted">{deal.leadName}</span>
      </div>

      <div className="mt-3">
        <p className="text-base font-semibold text-ink">{formatMoneyCompact(value)}</p>
        {hasDiscount && (
          <p className="text-xs text-ink-muted line-through">{formatMoneyCompact(deal.askingPrice)}</p>
        )}
        {deal.commissionAmount != null && (
          <p className="mt-0.5 text-xs text-ink-muted">
            Commission {formatMoneyCompact(deal.commissionAmount)}
          </p>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>Closing probability</span>
          <span className="font-medium text-ink">{Math.round(deal.closingProbability * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${deal.closingProbability * 100}%`,
              backgroundColor: probabilityColor(deal.closingProbability),
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        {closeDateLabel(deal)}
      </div>

      {deal.notes && (
        <div className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-ink-muted">
          {deal.notes}
        </div>
      )}
    </div>
  );
}
