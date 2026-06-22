"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/types";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

/** Create a new property — returns the new property's id. */
export async function createProperty(formData: FormData) {
  const { supabase, userId } = await getUser();

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

  const insert: TablesInsert<"properties"> = {
    agent_id: userId,
    title,
    property_type: propertyType as TablesInsert<"properties">["property_type"],
    price,
    city: String(formData.get("city") ?? "Lagos").trim() || "Lagos",
    area: String(formData.get("area") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    bedrooms: Number(formData.get("bedrooms")) || null,
    bathrooms: Number(formData.get("bathrooms")) || null,
    size_sqm: sizeSqm,
    condition: (String(formData.get("condition") ?? "").trim() || null) as
      | TablesInsert<"properties">["condition"]
      | null,
    furnishing: (String(formData.get("furnishing") ?? "").trim() || null) as
      | TablesInsert<"properties">["furnishing"]
      | null,
    amenities: amenities.length > 0 ? amenities : null,
    status: (String(formData.get("status") ?? "active")) as TablesInsert<"properties">["status"],
    ownership: "own",
  };

  const { data, error } = await supabase
    .from("properties")
    .insert(insert)
    .select("id")
    .single();

  if (error) {
    redirect(`/properties/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/properties");
  redirect(`/properties/${data.id}`);
}

/** Update editable fields of an existing property. */
export async function updateProperty(propertyId: string, formData: FormData) {
  const { supabase } = await getUser();

  const amenities = formData.getAll("amenities").map(String).filter(Boolean);

  const update: TablesUpdate<"properties"> = {
    title: String(formData.get("title") ?? "").trim() || undefined,
    price: Number(formData.get("price")) || undefined,
    area: String(formData.get("area") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    bedrooms: Number(formData.get("bedrooms")) || null,
    bathrooms: Number(formData.get("bathrooms")) || null,
    size_sqm: Number(formData.get("size")) || null,
    condition: (String(formData.get("condition") ?? "").trim() || null) as
      | TablesUpdate<"properties">["condition"]
      | null,
    furnishing: (String(formData.get("furnishing") ?? "").trim() || null) as
      | TablesUpdate<"properties">["furnishing"]
      | null,
    amenities: amenities.length > 0 ? amenities : null,
    status: (String(formData.get("status") ?? "active")) as TablesUpdate<"properties">["status"],
  };

  const { error } = await supabase
    .from("properties")
    .update(update)
    .eq("id", propertyId);

  if (error) throw new Error(error.message);

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/properties");
}

/** Delete a property (cascades to photos and documents via FK). */
export async function deleteProperty(formData: FormData) {
  const { supabase } = await getUser();
  const propertyId = String(formData.get("propertyId") ?? "");

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) throw new Error(error.message);

  revalidatePath("/properties");
  redirect("/properties");
}

/**
 * Upload one or more photos to the property-photos bucket.
 * Path convention: {agent_id}/{property_id}/{filename}
 * After upload, inserts rows into property_photos table.
 */
export async function uploadPropertyPhotos(formData: FormData) {
  const { supabase, userId } = await getUser();

  const propertyId = String(formData.get("propertyId") ?? "");
  const files = formData.getAll("photos") as File[];

  if (!propertyId || files.length === 0) return;

  // Get current max sort_order
  const { data: existing } = await supabase
    .from("property_photos")
    .select("sort_order")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const isFirst = sortOrder === 0;

  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${userId}/${propertyId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("property-photos")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Photo upload error:", uploadError.message);
      continue;
    }

    await supabase.from("property_photos").insert({
      property_id: propertyId,
      storage_path: storagePath,
      is_primary: isFirst && sortOrder === 0,
      sort_order: sortOrder,
    });

    sortOrder++;
  }

  revalidatePath(`/properties/${propertyId}`);
}

/** Delete a photo from storage and the property_photos table. */
export async function deletePropertyPhoto(formData: FormData) {
  const { supabase } = await getUser();
  const photoId = String(formData.get("photoId") ?? "");
  const storagePath = String(formData.get("storagePath") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");

  // Remove from storage first
  await supabase.storage.from("property-photos").remove([storagePath]);

  // Remove DB row
  await supabase.from("property_photos").delete().eq("id", photoId);

  revalidatePath(`/properties/${propertyId}`);
}

/**
 * Upload a document to the property-documents bucket (private).
 * Path convention: {agent_id}/{property_id}/{filename}
 */
export async function uploadPropertyDocument(formData: FormData) {
  const { supabase, userId } = await getUser();

  const propertyId = String(formData.get("propertyId") ?? "");
  const docType = String(formData.get("docType") ?? "other");
  const label = String(formData.get("label") ?? "").trim() || null;
  const file = formData.get("document") as File | null;

  if (!propertyId || !file) return;

  const ext = file.name.split(".").pop() ?? "pdf";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${userId}/${propertyId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("property-documents")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("property_documents").insert({
    property_id: propertyId,
    doc_type: docType as "title_doc" | "survey_plan" | "deed" | "offer_letter" | "other",
    storage_path: storagePath,
    label,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/properties/${propertyId}`);
}

/** Delete a document from storage and the property_documents table. */
export async function deletePropertyDocument(formData: FormData) {
  const { supabase } = await getUser();
  const docId = String(formData.get("docId") ?? "");
  const storagePath = String(formData.get("storagePath") ?? "");
  const propertyId = String(formData.get("propertyId") ?? "");

  await supabase.storage.from("property-documents").remove([storagePath]);
  await supabase.from("property_documents").delete().eq("id", docId);

  revalidatePath(`/properties/${propertyId}`);
}
