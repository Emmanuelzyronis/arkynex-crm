"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { properties, propertyPhotos, propertyDocuments } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

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
    city: String(formData.get("city") ?? "Lagos").trim() || "Lagos",
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
  await requireUser();

  const amenities = formData.getAll("amenities").map(String).filter(Boolean);

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
    })
    .where(eq(properties.id, propertyId));

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/properties");
}

/** Delete a property (cascades to photos and documents via FK). */
export async function deleteProperty(formData: FormData) {
  await requireUser();
  const propertyId = String(formData.get("propertyId") ?? "");

  await db.delete(properties).where(eq(properties.id, propertyId));

  revalidatePath("/properties");
  redirect("/properties");
}

/** Upload one or more photos — STUB: R2 upload not yet implemented (Phase 3). */
export async function uploadPropertyPhotos(formData: FormData) {
  await requireUser();

  const propertyId = String(formData.get("propertyId") ?? "");
  const files = formData.getAll("photos") as File[];

  if (!propertyId || files.length === 0) return;

  console.log("R2 upload not yet implemented — skipping", files.length, "photo(s)");
  // TODO: Implement R2 storage upload in Phase 3

  revalidatePath(`/properties/${propertyId}`);
}

/** Delete a photo — STUB: R2 delete not yet implemented (Phase 3). */
export async function deletePropertyPhoto(formData: FormData) {
  await requireUser();

  const photoId = String(formData.get("photoId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");

  console.log("R2 delete not yet implemented — skipping photo", photoId);
  // TODO: Implement R2 storage delete in Phase 3

  revalidatePath(`/properties/${propertyId}`);
}

/** Upload a document — STUB: R2 upload not yet implemented (Phase 3). */
export async function uploadPropertyDocument(formData: FormData) {
  await requireUser();

  const propertyId = String(formData.get("propertyId") ?? "");
  const file = formData.get("document") as File | null;

  if (!propertyId || !file) return;

  console.log("R2 upload not yet implemented — skipping document");
  // TODO: Implement R2 storage upload in Phase 3

  revalidatePath(`/properties/${propertyId}`);
}

/** Delete a document — STUB: R2 delete not yet implemented (Phase 3). */
export async function deletePropertyDocument(formData: FormData) {
  await requireUser();

  const docId = String(formData.get("docId") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");

  console.log("R2 delete not yet implemented — skipping document", docId);
  // TODO: Implement R2 storage delete in Phase 3

  revalidatePath(`/properties/${propertyId}`);
}
