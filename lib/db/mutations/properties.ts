"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { properties, propertyPhotos, propertyDocuments } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";
import { deleteObject, uploadObject } from "@/lib/storage/blob";

type PropertyInsert = typeof properties.$inferInsert;

/** Create a new property — returns the new property's id. */
export async function createProperty(formData: FormData) {
  const userId = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const propertyType = String(formData.get("propertyType") ?? "").trim();
  const price = Number(formData.get("price")) || 0;

  if (!title || !propertyType || !price) {
    redirect(
      `/properties/new?error=${encodeURIComponent("Title, type and price are required.")}`,
    );
  }

  const amenities = formData.getAll("amenities").map(String).filter(Boolean);
  const sizeSqm = Number(formData.get("size")) || null;

  const insert: PropertyInsert = {
    agentId: userId,
    title,
    propertyType,
    price,
    city: String(formData.get("city") ?? "New York").trim() || "New York",
    area: String(formData.get("area") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    bedrooms: Number(formData.get("bedrooms")) || null,
    bathrooms: Number(formData.get("bathrooms")) || null,
    sizeSqm,
    condition: String(formData.get("condition") ?? "").trim() || null,
    furnishing: String(formData.get("furnishing") ?? "").trim() || null,
    amenities: amenities.length > 0 ? amenities : null,
    status: String(formData.get("status") ?? "active"),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    ownership: "own",
  };

  try {
    const [property] = await db
      .insert(properties)
      .values(insert)
      .returning({ id: properties.id });

    revalidatePath("/properties");
    redirect(`/properties/${property.id}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(`/properties/new?error=${encodeURIComponent(message)}`);
  }
}

/** Update editable fields of an existing property. */
export async function updateProperty(propertyId: string, formData: FormData) {
  const userId = await requireUser();

  const amenities = formData.getAll("amenities").map(String).filter(Boolean);
  const imageUrl = formData.get("imageUrl");

  await db
    .update(properties)
    .set({
      title: String(formData.get("title") ?? "").trim() || undefined,
      price: Number(formData.get("price")) || undefined,
      area: String(formData.get("area") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      bedrooms: Number(formData.get("bedrooms")) || null,
      bathrooms: Number(formData.get("bathrooms")) || null,
      sizeSqm: Number(formData.get("size")) || null,
      condition: String(formData.get("condition") ?? "").trim() || null,
      furnishing: String(formData.get("furnishing") ?? "").trim() || null,
      amenities: amenities.length > 0 ? amenities : null,
      status: String(formData.get("status") ?? "active"),
      ...(imageUrl !== null ? { imageUrl: String(imageUrl).trim() || null } : {}),
    })
    .where(and(eq(properties.id, propertyId), eq(properties.agentId, userId)));

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/properties");
}

/** Delete a property (cascades to photos and documents via FK). */
export async function deleteProperty(formData: FormData) {
  const userId = await requireUser();
  const propertyId = String(formData.get("propertyId") ?? "");

  await db
    .delete(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.agentId, userId)));

  revalidatePath("/properties");
  redirect("/properties");
}

/**
 * Upload one or more photos to Vercel Blob.
 * Key convention: properties/{propertyId}/photos/{uuid}.{ext}
 */
export async function uploadPropertyPhotos(formData: FormData) {
  const userId = await requireUser();

  const propertyId = String(formData.get("propertyId") ?? "");
  const files = formData.getAll("photos") as File[];

  if (!propertyId || files.length === 0) return;

  // Confirm the property belongs to this agent before writing.
  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.agentId, userId)))
    .limit(1);

  if (!property) throw new Error("Property not found");

  const [{ maxSort }] = await db
    .select({ maxSort: sql<number>`coalesce(max(${propertyPhotos.sortOrder}), -1)::int` })
    .from(propertyPhotos)
    .where(eq(propertyPhotos.propertyId, propertyId));

  let sortOrder = (maxSort ?? -1) + 1;

  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const key = `properties/${propertyId}/photos/${crypto.randomUUID()}.${ext}`;

    const { url } = await uploadObject(
      key,
      new Uint8Array(await file.arrayBuffer()),
      file.type,
    );
    await db.insert(propertyPhotos).values({
      propertyId,
      storagePath: url,
      isPrimary: sortOrder === 0,
      sortOrder,
    });

    sortOrder++;
  }

  revalidatePath(`/properties/${propertyId}`);
}

/** Delete a photo from Vercel Blob and the property_photos table. */
export async function deletePropertyPhoto(formData: FormData) {
  const userId = await requireUser();

  const photoId = String(formData.get("photoId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");

  const [photo] = await db
    .select({ storagePath: propertyPhotos.storagePath })
    .from(propertyPhotos)
    .innerJoin(properties, eq(propertyPhotos.propertyId, properties.id))
    .where(
      and(
        eq(propertyPhotos.id, photoId),
        eq(properties.agentId, userId),
      ),
    )
    .limit(1);

  if (!photo) return;

  await deleteObject(photo.storagePath);
  await db.delete(propertyPhotos).where(eq(propertyPhotos.id, photoId));

  revalidatePath(`/properties/${propertyId}`);
}

/**
 * Upload a document to Vercel Blob.
 * Key convention: properties/{propertyId}/documents/{uuid}.{ext}
 * Downloads are proxied through /api/documents/[id] after an ownership check.
 */
export async function uploadPropertyDocument(formData: FormData) {
  const userId = await requireUser();

  const propertyId = String(formData.get("propertyId") ?? "");
  const docType = String(formData.get("docType") ?? "other");
  const label = String(formData.get("label") ?? "").trim() || null;
  const file = formData.get("document") as File | null;

  if (!propertyId || !file) return;

  const [property] = await db
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, propertyId), eq(properties.agentId, userId)))
    .limit(1);

  if (!property) throw new Error("Property not found");

  const ext = file.name.split(".").pop() ?? "pdf";
  const key = `properties/${propertyId}/documents/${crypto.randomUUID()}.${ext}`;

  const { url } = await uploadObject(
    key,
    new Uint8Array(await file.arrayBuffer()),
    file.type,
  );
  await db.insert(propertyDocuments).values({
    propertyId,
    docType,
    storagePath: url,
    label,
  });

  revalidatePath(`/properties/${propertyId}`);
}

/** Delete a document from Vercel Blob and the property_documents table. */
export async function deletePropertyDocument(formData: FormData) {
  const userId = await requireUser();

  const docId = String(formData.get("docId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");

  const [doc] = await db
    .select({ storagePath: propertyDocuments.storagePath })
    .from(propertyDocuments)
    .innerJoin(properties, eq(propertyDocuments.propertyId, properties.id))
    .where(
      and(
        eq(propertyDocuments.id, docId),
        eq(properties.agentId, userId),
      ),
    )
    .limit(1);

  if (!doc) return;

  await deleteObject(doc.storagePath);
  await db.delete(propertyDocuments).where(eq(propertyDocuments.id, docId));

  revalidatePath(`/properties/${propertyId}`);
}
