import type { Database, Tables, SupaClient } from "@/lib/supabase/types";

export type Property = Tables<"properties">;
export type PropertyPhoto = Tables<"property_photos">;
export type PropertyDocument = Tables<"property_documents">;

export type PropertyWithMedia = Property & {
  property_photos: PropertyPhoto[];
  property_documents: PropertyDocument[];
};

export type PropertyFilters = {
  status?: string;
  propertyType?: string;
  search?: string;
};

/**
 * All properties for the signed-in agent (RLS scoped).
 * Optional status/type/search filters.
 */
export async function getProperties(
  supabase: SupaClient,
  filters: PropertyFilters = {},
) {
  let query = supabase
    .from("properties")
    .select("*, property_photos(id, storage_path, is_primary, sort_order)")
    .order("listed_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.propertyType && filters.propertyType !== "all") {
    query = query.eq("property_type", filters.propertyType);
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    query = query.or(`title.ilike.${q},area.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (Property & { property_photos: PropertyPhoto[] })[];
}

/**
 * Single property with all photos and documents.
 */
export async function getProperty(
  supabase: SupaClient,
  id: string,
) {
  const { data, error } = await supabase
    .from("properties")
    .select("*, property_photos(*), property_documents(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as PropertyWithMedia;
}

/**
 * Generate a public URL for a photo stored in Supabase Storage.
 * The property-photos bucket is public so no signing is needed.
 */
export function getPhotoUrl(
  supabase: SupaClient,
  storagePath: string,
) {
  const { data } = supabase.storage
    .from("property-photos")
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Generate a signed URL for a private document (property-documents bucket).
 * Valid for 60 minutes.
 */
export async function getDocumentUrl(
  supabase: SupaClient,
  storagePath: string,
) {
  const { data, error } = await supabase.storage
    .from("property-documents")
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
