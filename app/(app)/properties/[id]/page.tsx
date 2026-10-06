import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bath, BedDouble, DollarSign, Eye, MapPin, MessageSquare, Ruler, Trash2 } from "lucide-react";

import { getProperty, getPhotoUrl } from "@/lib/db/queries/properties";
import { deleteProperty, updateProperty } from "@/lib/db/mutations/properties";
import { PhotoUploadPanel } from "@/components/properties/photo-upload-panel";
import { DocumentUploadPanel } from "@/components/properties/document-upload-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormSection } from "@/components/forms/form-layout";
import { BuildingIllustration } from "@/components/landing/building-illustration";
import { amenityOptions, conditionOptions, furnishingOptions, operatingAreas, propertyStatusOptions, propertyTypeOptions } from "@/lib/options";
import { illustrationKind, statusConfig, ACCENTS } from "@/lib/mock-properties";
import type { PropertyType } from "@/lib/mock-properties";
import { requireUser } from "@/lib/auth/user";
import { formatMoneyCompact } from "@/lib/currency";


export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUser();

  const property = await getProperty(userId, id);
  if (!property) notFound();

  const status = statusConfig[property.status as keyof typeof statusConfig] ?? { label: property.status, color: "#64748B" };
  const kind = illustrationKind(property.propertyType as PropertyType);
  const primaryPhoto = property.propertyPhotos.find((p) => p.isPrimary) ?? property.propertyPhotos[0];
  const photoUrl = primaryPhoto ? getPhotoUrl(primaryPhoto.storagePath) : null;
  const updateWithId = updateProperty.bind(null, property.id);

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Properties
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Hero image */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-line">
            {photoUrl || property.imageUrl ? (
              <img
                src={(photoUrl ?? property.imageUrl) as string}
                alt={property.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <BuildingIllustration className="h-full w-full" accent={ACCENTS[0]} kind={kind} gradientId={property.id} />
            )}
            <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-xs font-medium shadow-sm" style={{ color: status.color }}>
              {status.label}
            </span>
          </div>

          {/* Title + stats */}
          <div className="rounded-2xl border border-line bg-card p-5">
            <h1 className="text-xl font-semibold text-ink">{property.title}</h1>
            {(property.area || property.city) && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                <MapPin className="h-3.5 w-3.5" />
                {[property.area, property.city].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{formatMoneyCompact(property.price)}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-muted">
              {property.bedrooms != null && <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{property.bedrooms} Beds</span>}
              {property.bathrooms != null && <span className="flex items-center gap-1.5"><Bath className="h-4 w-4" />{property.bathrooms} Baths</span>}
              {property.sizeSqm != null && <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4" />{property.sizeSqm.toLocaleString()} sqm</span>}
              <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />{property.inquiryCount} inquiries</span>
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{property.viewingCount} viewings</span>
            </div>

            {property.description && (
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">{property.description}</p>
            )}

            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-muted">{a}</span>
                ))}
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="rounded-2xl border border-line bg-card p-5">
            <PhotoUploadPanel
              propertyId={property.id}
              photos={property.propertyPhotos}
            />
          </div>

          {/* Documents */}
          <div className="rounded-2xl border border-line bg-card p-5">
            <DocumentUploadPanel
              propertyId={property.id}
              documents={property.propertyDocuments}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Edit form */}
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-sm font-semibold text-ink">Edit Property</h2>
            <form className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink" htmlFor="title">Title</label>
                <Input id="title" name="title" defaultValue={property.title} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink" htmlFor="price">Price</label>
                <CurrencyInput id="price" name="price" defaultValue={property.price} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink" htmlFor="status">Status</label>
                <Select id="status" name="status" defaultValue={property.status}>
                  {propertyStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-ink" htmlFor="description">Description</label>
                <Textarea id="description" name="description" defaultValue={property.description ?? ""} className="min-h-[72px]" />
              </div>
              <Button size="sm" className="w-full" formAction={updateWithId}>
                Save changes
              </Button>
            </form>
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-line bg-card p-5 text-sm">
            <h2 className="font-semibold text-ink">Details</h2>
            <div className="mt-3 space-y-2 text-ink-muted">
              <div className="flex justify-between"><span>Type</span><span className="font-medium capitalize text-ink">{property.propertyType}</span></div>
              <div className="flex justify-between"><span>Ownership</span><span className="font-medium capitalize text-ink">{property.ownership}</span></div>
              {property.condition && <div className="flex justify-between"><span>Condition</span><span className="font-medium capitalize text-ink">{property.condition}</span></div>}
              {property.furnishing && <div className="flex justify-between"><span>Furnishing</span><span className="font-medium capitalize text-ink">{property.furnishing}</span></div>}
              <div className="flex justify-between"><span>Listed</span><span className="font-medium text-ink">{new Date(property.listedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
            </div>
          </div>

          {/* Delete */}
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-sm font-semibold text-ink">Danger Zone</h2>
            <form className="mt-3">
              <input type="hidden" name="propertyId" value={property.id} />
              <Button type="submit" variant="ghost" size="sm" className="w-full text-status-lost hover:bg-status-lost/5 hover:text-status-lost" formAction={deleteProperty}>
                <Trash2 className="h-4 w-4" />Delete property
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
