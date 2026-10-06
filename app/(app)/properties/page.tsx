import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { getProperties, getPhotoUrl } from "@/lib/db/queries/properties";
import { Button } from "@/components/ui/button";
import { PropertiesGrid } from "@/components/properties/properties-grid";
import { requireUser } from "@/lib/auth/user";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>;
}) {
  const { status, type, q } = await searchParams;
  const userId = await requireUser();

  const properties = await getProperties(userId, {
    status,
    propertyType: type,
    search: q,
  });

  // Attach public photo URLs
  const propertiesWithUrls = properties.map((p) => ({
    ...p,
    primaryPhotoUrl: p.propertyPhotos.find((ph) => ph.isPrimary)
      ? getPhotoUrl(p.propertyPhotos.find((ph) => ph.isPrimary)!.storagePath)
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Properties</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {properties.length} propert{properties.length !== 1 ? "ies" : "y"} listed
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="h-4 w-4" />
            Add Property
          </Link>
        </Button>
      </div>

      <PropertiesGrid properties={propertiesWithUrls} />
    </div>
  );
}
