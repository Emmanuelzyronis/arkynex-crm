import Link from "next/link";

import { statusConfig } from "@/lib/mock-properties";
import type { ReportTopProperty } from "@/lib/db/queries/reports";

export function TopPropertiesTable({ properties }: { properties: ReportTopProperty[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">Top Properties</h2>
        <p className="mt-1 text-sm text-ink-muted">By inquiries</p>
      </div>

      {properties.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-muted">No properties listed yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {properties.map((property, i) => {
            const status = statusConfig[property.status as keyof typeof statusConfig] ?? { label: property.status, color: "#64748B" };
            return (
              <li key={property.id}>
                <Link href={`/properties/${property.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-ink-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{property.title}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {[property.area, property.city].filter(Boolean).join(", ")} · {property.inquiryCount} inquiries · {property.viewingCount} viewings
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${status.color}1A`, color: status.color }}>
                    {status.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
