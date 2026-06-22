"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { propertyStatusFilters, propertyTypeFilters } from "@/lib/mock-properties";
import type { Property, PropertyPhoto } from "@/lib/supabase/queries/properties";

type PropertyWithUrl = Property & {
  property_photos: PropertyPhoto[];
  primaryPhotoUrl: string | null;
};

import { Bath, BedDouble, Eye, MessageSquare, Ruler } from "lucide-react";
import { BuildingIllustration } from "@/components/landing/building-illustration";
import { illustrationKind, statusConfig, ACCENTS } from "@/lib/mock-properties";
import type { PropertyType } from "@/lib/mock-properties";

function formatNaira(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  return `₦${Math.round(n / 1_000_000)}M`;
}

function PropertyCard({ property, index }: { property: PropertyWithUrl; index: number }) {
  const router = useRouter();
  const status = statusConfig[property.status as keyof typeof statusConfig] ?? { label: property.status, color: "#64748B" };
  const accent = ACCENTS[index % ACCENTS.length];
  const kind = illustrationKind(property.property_type as PropertyType);

  return (
    <div
      onClick={() => router.push(`/properties/${property.id}`)}
      className="cursor-pointer overflow-hidden rounded-2xl border border-line bg-card transition-shadow hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative aspect-[16/10]">
        {property.primaryPhotoUrl ? (
          <img
            src={property.primaryPhotoUrl}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <BuildingIllustration
            className="h-full w-full"
            accent={accent}
            kind={kind}
            gradientId={property.id}
          />
        )}
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
          {[property.area, property.city].filter(Boolean).join(", ")}
        </p>
        <p className="mt-2 text-base font-semibold text-ink">{formatNaira(property.price)}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-ink-muted">
          {property.bedrooms != null && (
            <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.bedrooms} Beds</span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms} Baths</span>
          )}
          {property.size_sqm != null && (
            <span className="flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{property.size_sqm.toLocaleString()} sqm</span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-line pt-3 text-xs text-ink-muted">
          <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{property.inquiry_count} inquiries</span>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{property.viewing_count} viewings</span>
        </div>
      </div>
    </div>
  );
}

export function PropertiesGrid({ properties }: { properties: PropertyWithUrl[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return properties.filter((p) => {
      const matchesStatus = status === "all" || p.status === status;
      const matchesType = type === "all" || p.property_type === type;
      const matchesQuery = q === "" || p.title.toLowerCase().includes(q) || (p.area ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesType && matchesQuery;
    });
  }, [properties, query, status, type]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or area..." className="pl-9" />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-full sm:w-44">
          {propertyTypeFilters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {propertyStatusFilters.map((f) => {
          const active = status === f.value;
          return (
            <button key={f.value} type="button" onClick={() => setStatus(f.value)}
              className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", active ? "border-primary bg-primary/10 text-primary" : "border-line text-ink-muted hover:border-ink-muted")}>
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-line bg-card px-5 py-10 text-center text-sm text-ink-muted">
          {properties.length === 0 ? "No properties yet — add your first one!" : "No properties match your filters."}
        </p>
      )}
    </div>
  );
}
