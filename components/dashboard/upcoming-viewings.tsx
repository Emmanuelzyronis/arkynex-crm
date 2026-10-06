import Link from "next/link";
import { Building2 } from "lucide-react";

import type { UpcomingViewing } from "@/lib/db/queries/dashboard";

function formatViewingTime(iso: string | Date) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + `, ${time}`;
}

export function UpcomingViewings({ viewings }: { viewings: UpcomingViewing[] }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Upcoming Viewings</h2>
        <Link href="/viewings" className="text-sm font-medium text-primary hover:text-primary-hover">
          View all
        </Link>
      </div>

      {viewings.length === 0 ? (
        <div className="mt-4 flex items-center justify-center py-8">
          <p className="text-sm text-ink-muted">No upcoming viewings scheduled.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {viewings.map((viewing) => (
            <li key={viewing.id} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{viewing.propertyTitle}</p>
                <p className="text-xs text-ink-muted">{formatViewingTime(viewing.scheduledAt)}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-muted">{viewing.leadName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
