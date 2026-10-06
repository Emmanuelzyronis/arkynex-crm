import type { Database, Tables, SupaClient } from "@/lib/supabase/types";

export type ViewingRow = Tables<"viewings">;

export type ViewingWithDetails = ViewingRow & {
  leads: { full_name: string; phone: string } | null;
  properties: { title: string; area: string | null } | null;
};

export type ViewingFilter = {
  status?: string;
  search?: string;
};

export async function getViewings(
  supabase: SupaClient,
  filters: ViewingFilter = {},
): Promise<ViewingWithDetails[]> {
  let query = supabase
    .from("viewings")
    .select("*, leads(full_name, phone), properties(title, area)")
    .order("scheduled_at", { ascending: true });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ViewingWithDetails[];
}

export async function getViewing(
  supabase: SupaClient,
  id: string,
): Promise<ViewingWithDetails> {
  const { data, error } = await supabase
    .from("viewings")
    .select("*, leads(full_name, phone), properties(title, area)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ViewingWithDetails;
}
