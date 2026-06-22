import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/types";

export type Lead = Tables<"leads">;

export type LeadFilters = {
  stage?: string;
  archived?: boolean;
  search?: string;
};

/**
 * Fetch all leads for the signed-in agent, with optional filters.
 * Always scoped to `agent_id = auth.uid()` via RLS — no extra filter needed.
 */
export async function getLeads(
  supabase: SupabaseClient<Database>,
  filters: LeadFilters = {},
) {
  let query = supabase
    .from("leads")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.stage && filters.stage !== "all") {
    // Support multi-stage groups (e.g. "viewing_scheduled,viewed")
    const stages = filters.stage.split(",");
    if (stages.length === 1) {
      query = query.eq("stage", stages[0]);
    } else {
      query = query.in("stage", stages);
    }
  }

  if (typeof filters.archived === "boolean") {
    query = query.eq("archived", filters.archived);
  } else {
    // Default: hide archived
    query = query.eq("archived", false);
  }

  if (filters.search) {
    // Full-text search using ilike on name + phone + area (simple approach; swap
    // for trigram search when you have 100+ leads using idx_leads_name_trgm).
    const q = `%${filters.search}%`;
    query = query.or(`full_name.ilike.${q},phone.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Lead[];
}

/**
 * Fetch a single lead by id.
 * RLS ensures the agent can only read their own lead.
 */
export async function getLead(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const { data, error } = await supabase
    .from("leads")
    .select("*, lead_stage_history(*), communications(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
