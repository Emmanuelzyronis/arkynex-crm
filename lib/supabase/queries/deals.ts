import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/types";

export type DealRow = Tables<"deals">;

export type DealWithDetails = DealRow & {
  leads: { full_name: string; phone: string } | null;
  properties: { title: string; area: string | null; price: number } | null;
  deal_offers: Tables<"deal_offers">[];
};

export async function getDeals(
  supabase: SupabaseClient<Database>,
): Promise<DealWithDetails[]> {
  const { data, error } = await supabase
    .from("deals")
    .select("*, leads(full_name, phone), properties(title, area, price), deal_offers(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DealWithDetails[];
}

export async function getDeal(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<DealWithDetails> {
  const { data, error } = await supabase
    .from("deals")
    .select("*, leads(full_name, phone), properties(title, area, price), deal_offers(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as DealWithDetails;
}
