import { Bath, BedDouble, Eye, MessageSquare, Ruler } from "lucide-react";

import { BuildingIllustration } from "@/components/landing/building-illustration";
import { formatNaira } from "@/lib/mock-leads";
import { illustrationKind, statusConfig, type Property } from "@/lib/mock-properties";

export function PropertyCard({ property }: { property: Property }) {
  const status = statusConfig[property.status];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card transition-shadow hover:shadow-lg hover:shadow-ink/5">
      <div className="relative aspect-[16/10]">
        <BuildingIllustration
          className="h-full w-full"
          accent={property.accent}
          kind={illustrationKind(property.propertyType)}
          gradientId={property.id}
        />
        <span
          className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-medium shadow-sm"
          style={{ color: status.color }}
        >
          {status.label}
        </span>
      </div>

      <div className="p-4">
        <p className="truncate text-sm font-semibold text-ink">{property.title}</p>
        <p className="text-xs text-ink-muted">
          {property.area}, {property.city}
        </p>
        <p className="mt-2 text-base font-semibold text-ink">{formatNaira(property.price)}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {property.bedrooms} Beds
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms} Baths
            </span>
          )}
          {property.sizeSqm != null && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {property.sizeSqm.toLocaleString()} sqm
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {property.inquiryCount} inquiries
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {property.viewingCount} viewings
          </span>
        </div>
      </div>
    </div>
  );
}
