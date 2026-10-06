import "server-only";
import { db } from "@/lib/db";
import {
  properties,
  propertyPhotos,
  propertyDocuments,
} from "@/lib/db/schema";
import type {
  Property,
  PropertyPhoto,
  PropertyDocument,
} from "@/lib/db/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";

export type { Property, PropertyPhoto, PropertyDocument };

export type PropertyFilters = {
  status?: string;
  propertyType?: string;
  search?: string;
};

export type PropertyWithPhotos = Property & {
  propertyPhotos: Pick<PropertyPhoto, "id" | "storagePath" | "isPrimary" | "sortOrder">[];
};

export type PropertyWithMedia = Property & {
  propertyPhotos: PropertyPhoto[];
  propertyDocuments: PropertyDocument[];
};

/**
 * All properties for the agent, with optional status/type/search filters.
 * Joins primary photo fields for thumbnail display.
 */
export async function getProperties(
  agentId: string,
  filters: PropertyFilters = {},
): Promise<PropertyWithPhotos[]> {
  const conditions = [eq(properties.agentId, agentId)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(properties.status, filters.status));
  }

  if (filters.propertyType && filters.propertyType !== "all") {
    conditions.push(eq(properties.propertyType, filters.propertyType));
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    conditions.push(
      or(ilike(properties.title, q), ilike(properties.area, q))!,
    );
  }

  const rows = await db
    .select({
      property: properties,
      photo: {
        id: propertyPhotos.id,
        storagePath: propertyPhotos.storagePath,
        isPrimary: propertyPhotos.isPrimary,
        sortOrder: propertyPhotos.sortOrder,
      },
    })
    .from(properties)
    .leftJoin(propertyPhotos, eq(properties.id, propertyPhotos.propertyId))
    .where(and(...conditions))
    .orderBy(desc(properties.listedAt));

  // Group photos by property
  const grouped = new Map<string, PropertyWithPhotos>();
  for (const row of rows) {
    const propId = row.property.id;
    if (!grouped.has(propId)) {
      grouped.set(propId, { ...row.property, propertyPhotos: [] });
    }
    if (row.photo.id) {
      grouped.get(propId)!.propertyPhotos.push(row.photo);
    }
  }

  return Array.from(grouped.values());
}

/**
 * Single property with all photos and documents.
 */
export async function getProperty(
  agentId: string,
  id: string,
): Promise<PropertyWithMedia | null> {
  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.id, id), eq(properties.agentId, agentId)))
    .limit(1);

  if (!property) return null;

  const [photos, documents] = await Promise.all([
    db
      .select()
      .from(propertyPhotos)
      .where(eq(propertyPhotos.propertyId, id))
      .orderBy(propertyPhotos.sortOrder),
    db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.propertyId, id))
      .orderBy(propertyDocuments.createdAt),
  ]);

  return { ...property, propertyPhotos: photos, propertyDocuments: documents };
}

/**
 * Stub — storage migration (Phase 3) will provide R2 URL generation.
 */
export function getPhotoUrl(_storagePath: string): string {
  throw new Error("Not yet migrated — use R2");
}

/**
 * Stub — storage migration (Phase 3) will provide R2 URL generation.
 */
export function getDocumentUrl(_storagePath: string): string {
  throw new Error("Not yet migrated — use R2");
}
